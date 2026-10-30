import streamDeck from "@elgato/streamdeck";
import { Downloader } from "./actions/downloader";
import { PlaySoundAction } from "./actions/play-sound";
import { StopSoundAction } from "./actions/stop-sound";
import { AudioEngine } from "./audio/engine";
import { SoundRegistry } from "./sound-registry";

// "debug" or "trace" are useful while developing; "info" keeps the log readable.
streamDeck.logger.setLevel(process.env.STREAMBOARD_LOG_LEVEL === "debug" ? "debug" : "info");

const sounds = new SoundRegistry();
const downloader = new Downloader();
const engine = new AudioEngine(streamDeck.logger.createScope("AudioEngine"));

streamDeck.actions.registerAction(new PlaySoundAction(sounds, downloader, engine));
streamDeck.actions.registerAction(new StopSoundAction(sounds));

// Release the audio devices cleanly when the plugin is stopped or reloaded.
let shuttingDown = false;
const shutdown = async () => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  sounds.stopAll();
  await engine.closeAll();
};
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    shutdown().finally(() => process.exit(0));
  });
}

// Drop downloads that have not been used for a month.
downloader
  .prune(30)
  .then((removed) => removed && streamDeck.logger.info(`Pruned ${removed} cached download(s)`))
  .catch(() => undefined);

streamDeck.connect();
