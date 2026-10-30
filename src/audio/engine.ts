import { readFile, stat } from "node:fs/promises";

/**
 * Audio backend built on node-web-audio-api (a Rust implementation of the Web
 * Audio API with prebuilt binaries for Windows and macOS).
 *
 * - One AudioContext per output device, created on first use and closed after a
 *   period of silence so no audio stream stays open for nothing.
 * - Decoded files are kept in a small LRU cache so repeated presses start
 *   instantly without decoding again.
 */

type WebAudio = typeof import("node-web-audio-api");

/** Value used in the settings for "follow the system default output". */
export const DEFAULT_SINK = "default";

const IDLE_CLOSE_MS = 60_000;
const DECODED_CACHE_MAX_BYTES = 256 * 1024 * 1024;

let webAudioPromise: Promise<WebAudio> | undefined;

/**
 * Loads the native module lazily: if it cannot load on this machine the plugin
 * still starts, and the error is reported when a sound is played.
 */
export function loadWebAudio(): Promise<WebAudio> {
  webAudioPromise ??= import("node-web-audio-api").catch((error: unknown) => {
    webAudioPromise = undefined;
    throw new Error("Unable to load the audio engine (node-web-audio-api)", { cause: error });
  });
  return webAudioPromise;
}

export type PlaybackOptions = {
  /** 0–100. */
  volume: number;
  loop: boolean;
  /** Output device id from listOutputs(), or DEFAULT_SINK. */
  sinkId: string;
};

export type PlaybackHandle = {
  /** Stops the sound; `onEnded` still fires once. */
  stop(): void;
};

type SinkEntry = {
  context: AudioContext;
  activeSources: number;
  idleTimer?: NodeJS.Timeout;
};

type DecodedEntry = { buffer: AudioBuffer; bytes: number };

export type EngineLogger = {
  info: (...args: unknown[]) => unknown;
  warn: (...args: unknown[]) => unknown;
};

export class AudioEngine {
  private readonly sinks = new Map<string, SinkEntry>();
  private readonly decoded = new Map<string, DecodedEntry>();
  private readonly decoding = new Map<string, Promise<AudioBuffer>>();
  private decodedBytes = 0;

  constructor(private readonly log?: EngineLogger) {}

  /**
   * Plays a local file. Resolves once the sound has started; `onEnded` fires
   * when it finishes or is stopped.
   */
  async play(file: string, options: PlaybackOptions, onEnded: () => void): Promise<PlaybackHandle> {
    const sink = await this.getSink(options.sinkId);
    const buffer = await this.decode(sink.context, file);
    const { context } = sink;

    const gain = context.createGain();
    gain.gain.value = Math.max(0, Math.min(100, options.volume)) / 100;
    gain.connect(context.destination);

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = options.loop;
    source.connect(gain);

    let finished = false;
    const finish = () => {
      if (finished) {
        return;
      }
      finished = true;
      try {
        source.disconnect();
        gain.disconnect();
      } catch {
        // Already disconnected.
      }
      this.release(options.sinkId, sink);
      onEnded();
    };

    source.onended = finish;
    sink.activeSources++;
    if (sink.idleTimer) {
      clearTimeout(sink.idleTimer);
      sink.idleTimer = undefined;
    }

    if (context.state === "suspended") {
      await context.resume();
    }
    source.start();

    return {
      stop: () => {
        if (finished) {
          return;
        }
        try {
          source.stop();
        } catch {
          // Not started or already stopped.
        }
        // Do not rely only on `onended` (it is dispatched asynchronously).
        finish();
      },
    };
  }

  /** Lists the audio outputs, as { id, label }. */
  async listOutputs(): Promise<Array<{ id: string; label: string }>> {
    const { mediaDevices } = await loadWebAudio();
    const devices = await mediaDevices.enumerateDevices();
    const seen = new Set<string>();
    return devices
      .filter((device) => device.kind === "audiooutput" && device.deviceId && device.deviceId !== "default")
      .filter((device) => !seen.has(device.deviceId) && !!seen.add(device.deviceId))
      .map((device) => ({ id: device.deviceId, label: device.label || device.deviceId }));
  }

  /** Closes every audio stream (plugin shutdown). */
  async closeAll(): Promise<void> {
    const entries = [...this.sinks.values()];
    this.sinks.clear();
    await Promise.allSettled(entries.map((entry) => entry.context.close()));
  }

  private async getSink(sinkId: string): Promise<SinkEntry> {
    const existing = this.sinks.get(sinkId);
    if (existing && existing.context.state !== "closed") {
      return existing;
    }

    const { AudioContext } = await loadWebAudio();
    let context: AudioContext;
    if (sinkId === DEFAULT_SINK) {
      context = new AudioContext({ latencyHint: "playback" });
    } else {
      try {
        // `sinkId` is supported by node-web-audio-api but missing from TypeScript's DOM typings.
        context = new AudioContext({ latencyHint: "playback", sinkId } as AudioContextOptions);
      } catch (error) {
        // Device unplugged or renamed: fall back to the default output rather than failing.
        this.log?.warn(`Output "${sinkId}" unavailable, using the default output`, error);
        context = new AudioContext({ latencyHint: "playback" });
      }
    }

    const entry: SinkEntry = { context, activeSources: 0 };
    this.sinks.set(sinkId, entry);
    return entry;
  }

  private release(sinkId: string, entry: SinkEntry): void {
    entry.activeSources = Math.max(0, entry.activeSources - 1);
    if (entry.activeSources > 0) {
      return;
    }
    entry.idleTimer = setTimeout(() => {
      if (entry.activeSources === 0 && this.sinks.get(sinkId) === entry) {
        this.sinks.delete(sinkId);
        entry.context.close().catch(() => undefined);
      }
    }, IDLE_CLOSE_MS);
    entry.idleTimer.unref?.();
  }

  private async decode(context: AudioContext, file: string): Promise<AudioBuffer> {
    const info = await stat(file);
    // Buffers are resampled to the context rate, so the rate is part of the key;
    // size and mtime make an edited file decode again.
    const key = `${file}|${info.size}|${info.mtimeMs}|${context.sampleRate}`;

    const cached = this.decoded.get(key);
    if (cached) {
      // Refresh LRU position.
      this.decoded.delete(key);
      this.decoded.set(key, cached);
      return cached.buffer;
    }

    const pending = this.decoding.get(key);
    if (pending) {
      return pending;
    }

    const task = (async () => {
      const data = await readFile(file);
      const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
      let buffer: AudioBuffer;
      try {
        buffer = await context.decodeAudioData(arrayBuffer);
      } catch (error) {
        throw new Error(`Unsupported or corrupted audio file: ${file}`, { cause: error });
      }
      this.remember(key, buffer);
      return buffer;
    })();

    this.decoding.set(key, task);
    try {
      return await task;
    } finally {
      this.decoding.delete(key);
    }
  }

  private remember(key: string, buffer: AudioBuffer): void {
    const bytes = buffer.length * buffer.numberOfChannels * 4;
    if (bytes > DECODED_CACHE_MAX_BYTES) {
      return;
    }
    this.decoded.set(key, { buffer, bytes });
    this.decodedBytes += bytes;

    for (const [oldKey, entry] of this.decoded) {
      if (this.decodedBytes <= DECODED_CACHE_MAX_BYTES) {
        break;
      }
      this.decoded.delete(oldKey);
      this.decodedBytes -= entry.bytes;
    }
  }
}
