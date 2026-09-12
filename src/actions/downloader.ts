import { createHash } from "node:crypto";
import { mkdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const defaultCacheDirectory = path.join(os.tmpdir(), "streamboard");
const downloads = new Map<string, Promise<string>>();

export class Downloader {
  constructor(
    private readonly cacheDirectory = process.env.STREAMBOARD_CACHE_DIR ?? defaultCacheDirectory,
  ) {}

  async resolve(source: string): Promise<string> {
    const url = new URL(source);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error(`Unsupported URL protocol: ${url.protocol}`);
    }

    const hash = createHash("sha256").update(source).digest("hex");
    const target = path.join(this.cacheDirectory, `${hash}.audio`);
    try {
      if ((await stat(target)).isFile()) {
        return target;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
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

  private async download(url: URL, target: string): Promise<string> {
    await mkdir(this.cacheDirectory, { recursive: true });

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
          Referer: `${url.origin}/`,
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const data = new Uint8Array(await response.arrayBuffer());
      const temporary = `${target}.${process.pid}.${Date.now()}.part`;
      await writeFile(temporary, data);
      try {
        await rename(temporary, target);
      } catch (error) {
        await unlink(temporary).catch(() => undefined);
        throw error;
      }

      return target;
    } catch (error) {
      throw new Error(`Unable to download ${url.href}`, { cause: error });
    }
  }
}
