import streamDeck from "@elgato/streamdeck";
import { Downloader } from "./actions/downloader";
import { PlaySoundAction } from "./actions/play-sound";
import { StopSoundAction } from "./actions/stop-sound";
import { SoundRegistry } from "./sound-registry";

// "debug" or "trace" are useful while developing; "info" keeps the log readable.
streamDeck.logger.setLevel(process.env.STREAMBOARD_LOG_LEVEL === "debug" ? "debug" : "info");

const sounds = new SoundRegistry();
const downloader = new Downloader();

streamDeck.actions.registerAction(new PlaySoundAction(sounds, downloader));
streamDeck.actions.registerAction(new StopSoundAction(sounds));

// Make sure no mpv process keeps playing after the plugin is stopped or reloaded.
const shutdown = () => {
  sounds.stopAll();
};
process.once("exit", shutdown);
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    shutdown();
    process.exit(0);
  });
}

// Drop downloads that have not been used for a month.
downloader
  .prune(30)
  .then((removed) => removed && streamDeck.logger.info(`Pruned ${removed} cached download(s)`))
  .catch(() => undefined);

streamDeck.connect();
