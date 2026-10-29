import { spawn, type ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type PlayerOptions = {
  volume?: number;
  loop?: boolean;
  audioDevice?: string;
};

type PlayerEvents = {
  /** Playback finished, either naturally or because stop() was called. */
  end: [id: string];
  /** mpv could not be started or exited with an error. */
  playerror: [id: string, error: Error];
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bundledPlayerDir = path.join(__dirname, "tools", "player");

/**
 * Locates the mpv executable. An explicit path in STREAMBOARD_MPV_PATH (or the
 * legacy PLAY_WINDOWS_PATH) wins; otherwise the copy bundled with the plugin is
 * used on Windows, and the usual Homebrew locations are tried on macOS.
 */
export function resolveMpvPath(): string | undefined {
  const override = process.env.STREAMBOARD_MPV_PATH ?? process.env.PLAY_WINDOWS_PATH;
  if (override) {
    return override;
  }

  const candidates =
    process.platform === "win32"
      ? [path.join(bundledPlayerDir, "mpv.exe")]
      : [
          path.join(bundledPlayerDir, "mpv"),
          "/opt/homebrew/bin/mpv",
          "/usr/local/bin/mpv",
          "/usr/bin/mpv",
        ];

  return candidates.find((candidate) => existsSync(candidate));
}

/** Clamps a 0–100 volume, defaulting to 100 when unset or invalid. */
export function normalizeVolume(volume?: number): number {
  const value = Number(volume);
  if (volume == null || !Number.isFinite(value)) {
    return 100;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

export class Player extends EventEmitter<PlayerEvents> {
  private child: ChildProcess | null = null;
  private stopping = false;

  constructor(
    public readonly id: string,
    private readonly source: string,
    private readonly options: PlayerOptions = {},
    private readonly playerPath = resolveMpvPath(),
  ) {
    super();
  }

  get isRunning(): boolean {
    return this.child !== null;
  }

  play(): void {
    if (this.child) {
      return;
    }

    if (!this.playerPath || !existsSync(this.playerPath)) {
      const hint =
        process.platform === "darwin"
          ? " Install it with `brew install mpv` or set STREAMBOARD_MPV_PATH."
          : "";
      // Emit asynchronously so callers can attach listeners after play().
      queueMicrotask(() =>
        this.emit("playerror", this.id, new Error(`mpv not found (${this.playerPath ?? "no candidate path"}).${hint}`)),
      );
      return;
    }

    const args = [
      "--no-video",
      "--really-quiet",
      "--no-terminal",
      "--force-window=no",
      `--volume=${normalizeVolume(this.options.volume)}`,
      "--keep-open=no",
      "--idle=no",
    ];

    if (this.options.loop) {
      args.push("--loop-file=inf");
    }

    if (this.options.audioDevice) {
      args.push(`--audio-device=${this.options.audioDevice}`);
    }

    // "--" stops mpv from interpreting a file name starting with "-" as an option.
    args.push("--", this.source);

    const child = spawn(this.playerPath, args, {
      windowsHide: true,
      stdio: "ignore",
    });
    this.child = child;

    child.once("error", (error) => {
      if (this.child !== child) {
        return;
      }
      this.child = null;
      this.emit("playerror", this.id, error);
    });

    child.once("exit", (code, signal) => {
      if (this.child !== child) {
        return;
      }
      this.child = null;

      // A process we killed ourselves can report a non-zero code on Windows:
      // that is a normal stop, not an error.
      if (this.stopping || code === 0 || signal !== null) {
        this.emit("end", this.id);
        return;
      }

      this.emit("playerror", this.id, new Error(`mpv exited with code ${code}`));
    });
  }

  stop(): void {
    if (!this.child || this.stopping) {
      return;
    }
    this.stopping = true;
    if (!this.child.killed) {
      this.child.kill();
    }
  }
}
