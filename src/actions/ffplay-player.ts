import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";

export type Player = {
  play: () => void;
  stop: () => void;
  on: (event: string, callback: (id: string, error?: any) => void) => void;
};

export type FfplayOptions = {
  volume?: number;
  loop?: boolean;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultFfplayPath = path.join(__dirname, "tools", "ffplay.exe");
export class FfplayPlayer implements Player {
  private child: ChildProcess | null = null;
  private handlers = new Map<string, Array<(id: string, error?: any) => void>>();

  constructor(
    public readonly id: string,
    private readonly source: string,
    private readonly options: FfplayOptions = {},
    private readonly ffplayPath = process.env.FFPLAY_WINDOWS_PATH ?? defaultFfplayPath,
  ) {
    if (process.platform !== "win32") {
      throw new Error("FfplayPlayer is currently only supported on Windows.");
    }
  }

  play(): void {
    if (this.child) {
      return;
    }

    if (!existsSync(this.ffplayPath)) {
      this.emit("playerror", new Error(`ffplay not found at ${this.ffplayPath}`));
      return;
    }

    const volume = Math.round(this.options.volume ?? 1);
    const args = ["-nodisp", "-autoexit", "-loglevel", "error", "-volume", `${volume}`];

    if (this.options.loop) {
      args.push("-loop", "0");
    }

    args.push(this.source);

    const child = spawn(this.ffplayPath, args, {
      windowsHide: true,
      stdio: ["ignore", "ignore", "ignore"],
    });

    child.on("error", (error) => {
      this.child = null;
      this.emit("playerror", error);
    });

    child.on("exit", (code, signal) => {
      this.child = null;
      if (code === 0 || signal) {
        this.emit("end");
      } else {
        this.emit("playerror", new Error(`ffplay exited with code ${code}`));
      }
    });

    this.child = child;
  }

  stop(): void {
    if (!this.child) {
      return;
    }

    if (!this.child.killed) {
      this.child.kill();
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
}
