import { EventEmitter } from "node:events";
import { DEFAULT_SINK, type AudioEngine, type PlaybackHandle } from "../audio/engine";

export type PlayerOptions = {
  volume?: number;
  loop?: boolean;
  /** Output device id; undefined or "default" plays on the system default output. */
  audioDevice?: string;
};

type PlayerEvents = {
  /** Playback finished, either naturally or because stop() was called. */
  end: [id: string];
  /** The file could not be decoded or the output could not be opened. */
  playerror: [id: string, error: Error];
};

/** Clamps a 0–100 volume, defaulting to 100 when unset or invalid. */
export function normalizeVolume(volume?: number): number {
  const value = Number(volume);
  if (volume == null || !Number.isFinite(value)) {
    return 100;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** One sound being played by one key. */
export class Player extends EventEmitter<PlayerEvents> {
  private handle: PlaybackHandle | null = null;
  private started = false;
  private running = false;
  private stopRequested = false;

  constructor(
    public readonly id: string,
    private readonly source: string,
    private readonly options: PlayerOptions,
    private readonly engine: AudioEngine,
  ) {
    super();
  }

  get isRunning(): boolean {
    return this.running;
  }

  play(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    this.running = true;

    this.engine
      .play(
        this.source,
        {
          volume: normalizeVolume(this.options.volume),
          loop: !!this.options.loop,
          sinkId: this.options.audioDevice || DEFAULT_SINK,
        },
        () => this.finish(),
      )
      .then((handle) => {
        this.handle = handle;
        // stop() may have been called while the file was still decoding.
        if (this.stopRequested) {
          handle.stop();
        }
      })
      .catch((error: unknown) => {
        if (!this.running) {
          return;
        }
        this.running = false;
        if (this.stopRequested) {
          this.emit("end", this.id);
          return;
        }
        this.emit("playerror", this.id, error instanceof Error ? error : new Error(String(error)));
      });
  }

  stop(): void {
    if (!this.running || this.stopRequested) {
      return;
    }
    this.stopRequested = true;
    this.handle?.stop();
  }

  private finish(): void {
    if (!this.running) {
      return;
    }
    this.running = false;
    this.emit("end", this.id);
  }
}
