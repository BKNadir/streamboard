import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, readdir, rename, stat, unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";

const defaultCacheDirectory = path.join(os.tmpdir(), "streamboard");
/** Shared across instances so the same URL is never downloaded twice in parallel. */
const downloads = new Map<string, Promise<string>>();

export type DownloaderOptions = {
  cacheDirectory?: string;
  /** Abort a download that takes longer than this (ms). */
  timeoutMs?: number;
  /** Refuse files larger than this (bytes). */
  maxBytes?: number;
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

export class Downloader {
  private readonly cacheDirectory: string;
  private readonly timeoutMs: number;
  private readonly maxBytes: number;

  constructor(options: DownloaderOptions = {}) {
    this.cacheDirectory =
      options.cacheDirectory ?? process.env.STREAMBOARD_CACHE_DIR ?? defaultCacheDirectory;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.maxBytes = options.maxBytes ?? 50 * 1024 * 1024;
  }

  /** Returns a local path for the URL, downloading it into the cache if needed. */
  async resolve(source: string): Promise<string> {
    const url = parseHttpUrl(source);
    const hash = createHash("sha256").update(url.href).digest("hex");
    const target = path.join(this.cacheDirectory, `${hash}.audio`);

    if (await isFile(target)) {
      return target;
    }

    const pending = downloads.get(target);
    if (pending) {
      return pending;
    }

    const download = this.download(url, target);
    downloads.set(target, download);
    try {
      return await download;
    } finally {
      downloads.delete(target);
    }
  }

  /** Deletes cached files not used for `maxAgeDays`. Errors are ignored. */
  async prune(maxAgeDays = 30): Promise<number> {
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    let removed = 0;
    let entries: string[];
    try {
      entries = await readdir(this.cacheDirectory);
    } catch {
      return 0;
    }

    for (const entry of entries) {
      if (!entry.endsWith(".audio") && !entry.endsWith(".part")) {
        continue;
      }
      const file = path.join(this.cacheDirectory, entry);
      try {
        const info = await stat(file);
        if (Math.max(info.atimeMs, info.mtimeMs) < cutoff) {
          await unlink(file);
          removed++;
        }
      } catch {
        // File vanished or is locked by a running player: skip it.
      }
    }
    return removed;
  }

  private async download(url: URL, target: string): Promise<string> {
    await mkdir(this.cacheDirectory, { recursive: true });
    const temporary = `${target}.${process.pid}.${Date.now()}.part`;

    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Referer: `${url.origin}/` },
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const declared = Number(response.headers.get("content-length"));
      if (Number.isFinite(declared) && declared > this.maxBytes) {
        throw new Error(`File too large (${declared} bytes, limit ${this.maxBytes})`);
      }

      // Stream to disk instead of buffering the whole file in memory, and
      // enforce the size limit even when the server sends no Content-Length.
      let received = 0;
      const maxBytes = this.maxBytes;
      const limiter = new Transform({
        transform(chunk: Buffer, _encoding, callback) {
          received += chunk.length;
          if (received > maxBytes) {
            callback(new Error(`File too large (limit ${maxBytes} bytes)`));
            return;
          }
          callback(null, chunk);
        },
      });

      await pipeline(
        Readable.fromWeb(response.body as unknown as WebReadableStream<Uint8Array>),
        limiter,
        createWriteStream(temporary),
      );
      await rename(temporary, target);
      return target;
    } catch (error) {
      await unlink(temporary).catch(() => undefined);
      throw new Error(`Unable to download ${url.href}`, { cause: error });
    }
  }
}

function parseHttpUrl(source: string): URL {
  let url: URL;
  try {
    url = new URL(source.trim());
  } catch {
    throw new Error(`Invalid URL: ${source}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Unsupported URL protocol: ${url.protocol}`);
  }
  return url;
}

async function isFile(file: string): Promise<boolean> {
  try {
    return (await stat(file)).isFile();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}
