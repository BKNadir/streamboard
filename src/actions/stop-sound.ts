import streamDeck, { action, type KeyDownEvent, SingletonAction } from "@elgato/streamdeck";

@action({ UUID: "com.bknadir.streamboard.stop" })
export class StopSoundAction extends SingletonAction {
    constructor(private readonly playingSounds: Record<string, any>) {
        super();
    }

    override onKeyDown(ev: KeyDownEvent): void | Promise<void> {
        const keys = Object.keys(this.playingSounds);
        if (keys.length === 0) {
            streamDeck.logger.info("Stop pressed: no active sounds.");
            ev.action.showOk();
            return;
        }

        keys.forEach((key) => {
            try {
                this.playingSounds[key].stop();
            } catch (error) {
                streamDeck.logger.warn(`Failed to stop sound ${key}: ${error}`);
            }
            delete this.playingSounds[key];
        });

        streamDeck.logger.info(`Stopped ${keys.length} active sound(s).`);
        ev.action.showOk();
    }
}
