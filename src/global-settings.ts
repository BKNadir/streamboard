import streamDeck from "@elgato/streamdeck";

/** Settings shared by every StreamBoard key (Stream Deck "global settings"). */
export type GlobalSettings = {
  /** Output device used by every Play key; "default" or missing = system default output. */
  outputTarget?: string;
};

let current: GlobalSettings = {};

/**
 * Keeps an up-to-date copy of the global settings. The property inspector
 * writes them directly (sdpi `global` attribute) and Stream Deck notifies the
 * plugin, so a change made on one key applies to all keys, existing and new.
 */
export function initGlobalSettings(onChange?: (settings: GlobalSettings) => void): void {
  streamDeck.settings.onDidReceiveGlobalSettings<GlobalSettings>((ev) => {
    current = ev.settings ?? {};
    onChange?.(current);
  });

  streamDeck.settings
    .getGlobalSettings<GlobalSettings>()
    .then((settings) => {
      current = settings ?? {};
      onChange?.(current);
    })
    .catch((error) => streamDeck.logger.warn("Unable to read global settings", error));
}

export function getGlobalSettings(): GlobalSettings {
  return current;
}
