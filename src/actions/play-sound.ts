import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { FfplayPlayer } from "./ffplay-player";

type PlaySoundSettings = {
  volume?: number;
  sourceType?: "file" | "url";
  sourceFile?: string;
  sourceUrl?: string;
  mode?: "play_stop" | "play_overlap" | "play_restart" | "loop_stop";
};

@action({ UUID: "com.bknadir.streamboard.play" })
export class PlaySoundAction extends SingletonAction<PlaySoundSettings> {
    constructor(private readonly playingSounds: Record<string, any>) {
        super();
    }

    override onKeyDown(ev: KeyDownEvent<PlaySoundSettings>): void | Promise<void> {
        const settings = ev.payload.settings;
        const source = settings.sourceType === "url" ? settings.sourceUrl : settings.sourceFile;

        if (!source) {
            streamDeck.logger.error("No audio source available to play.");
            ev.action.showAlert();
            return;
        } else {
            const mode = settings.mode ?? "play_stop";
            const sameActionKeys = Object.keys(this.playingSounds).filter((id) => id.startsWith(ev.action.coordinates?.column + "-" + ev.action.coordinates?.row));
            if (mode === "play_stop" && sameActionKeys.length > 0) {
                sameActionKeys.forEach((key) => {
                    this.playingSounds[key].stop();
                    delete this.playingSounds[key];
                });
                ev.action.showOk();
                return;
            }

            if (mode === "play_restart" && sameActionKeys.length > 0) {
                sameActionKeys.forEach((key) => {
                    this.playingSounds[key].stop();
                    delete this.playingSounds[key];
                });
            }

            if (mode === "loop_stop" && sameActionKeys.length > 0) {
                sameActionKeys.forEach((key) => {
                    this.playingSounds[key].stop();
                    delete this.playingSounds[key];
                });
                ev.action.showOk();
                return;
            }

            const playerId = `${ev.action.coordinates?.column + "-" + ev.action.coordinates?.row}`;
            const player = new FfplayPlayer(playerId, source, {
                volume: settings.volume ?? 100,
                loop: mode === "loop_stop",
            });

            player.on("playerror", (id, error) => {
                streamDeck.logger.error(`Error playing sound (${playerId}): ${error}`);
                delete this.playingSounds[playerId];
                ev.action.showAlert();
            });

            player.on("end", (id) => {
                delete this.playingSounds[playerId];
            });

            this.playingSounds[playerId] = player;
            player.play();

            streamDeck.logger.info(`Playing sound with id=${playerId} source=${source}`);
            ev.action.showOk();
        }

    }
}
