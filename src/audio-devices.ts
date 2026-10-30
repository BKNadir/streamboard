import type { AudioEngine } from "./audio/engine";

export type AudioDeviceOption = { label: string; value: string };

type Logger = {
  error: (...args: unknown[]) => unknown;
};

const CACHE_TTL_MS = 30_000;
let cache: { at: number; items: AudioDeviceOption[] } | undefined;

/**
 * Lists the audio outputs (Windows and macOS). Results are cached briefly
 * because the property inspector asks every time it opens.
 */
export async function listAudioOutputs(
  engine: AudioEngine,
  log: Logger,
  force = false,
): Promise<AudioDeviceOption[]> {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.items;
  }

  try {
    const outputs = await engine.listOutputs();
    const items = outputs.map((output) => ({ label: output.label, value: output.id }));
    cache = { at: Date.now(), items };
    return items;
  } catch (error) {
    log.error("Audio output discovery failed", error);
    return [];
  }
}
