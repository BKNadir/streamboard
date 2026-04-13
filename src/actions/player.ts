import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";

export type MediaPlayer = {
  play: () => void;
  stop: () => void;
  on: (event: string, callback: (id: string, error?: any) => void) => void;
};

export type PlayerOptions = {
  volume?: number;
  loop?: boolean;
  audioDevice?: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultPlayerPath = path.join(__dirname, "tools/player", "mpv.exe");

export class Player implements MediaPlayer {
  private child: ChildProcess | null = null;
  private handlers = new Map<string, Array<(id: string, error?: any) => void>>();

  constructor(
    public readonly id: string,
    private readonly source: string,
    private readonly options: PlayerOptions = {},
    private readonly playPath = process.env.PLAY_WINDOWS_PATH ?? defaultPlayerPath,
  ) {
    if (process.platform !== "win32") {
      throw new Error("Player is currently only supported on Windows.");
    }
  }

  play(): void {
    if (this.child) {
      return;
    }

    if (!existsSync(this.playPath)) {
      this.emit("playerror", new Error(`Player not found at ${this.playPath}`));
      return;
    }

    const volume = this.normalizeVolume(this.options.volume);

    const args = [
      "--no-video",
      "--really-quiet",
      "--no-terminal",
      `--volume=${volume}`,
      "--keep-open=no",
      "--idle=no",
    ];

    if (this.options.loop) {
      args.push("--loop-file=inf");
    }

    if (this.options.audioDevice) {
      args.push(`--audio-device=${this.options.audioDevice}`);
    }

    args.push(this.source);

    const child = spawn(this.playPath, args, {
      windowsHide: true,
      stdio: "ignore",
    });

    this.child = child;

    child.on("error", (error) => {
      this.child = null;
      this.emit("playerror", error);
    });

    child.on("exit", (code, signal) => {
      this.child = null;

      if (code === 0 || signal !== null) {
        this.emit("end");
        return;
      }

      this.emit("playerror", new Error(`Player exited with code ${code}`));
    });
  }

  stop(): void {
    if (!this.child) {
      return;
    }

    if (!this.child.killed) {
      this.child.kill("SIGTERM");
    }

    this.child = null;
  }

  on(event: string, callback: (id: string, error?: any) => void): void {
    const callbacks = this.handlers.get(event) ?? [];
    callbacks.push(callback);
    this.handlers.set(event, callbacks);
  }

  private emit(event: string, error?: any): void {
    const callbacks = this.handlers.get(event);
    if (!callbacks) {
      return;
    }

    callbacks.forEach((callback) => callback(this.id, error));
  }

  private normalizeVolume(volume?: number): number {
    if (volume == null || Number.isNaN(volume)) {
      return 100;
    }

    if (volume <= 1) {
      return Math.max(0, Math.min(100, Math.round(volume * 100)));
    }

    return Math.max(0, Math.min(100, Math.round(volume)));
  }
}