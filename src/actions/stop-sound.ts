import streamDeck, { action, type KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import type { SoundRegistry } from "../sound-registry";

@action({ UUID: "com.bknadir.streamboard.stop" })
export class StopSoundAction extends SingletonAction {
  private readonly log = streamDeck.logger.createScope("StopSoundAction");

  constructor(private readonly sounds: SoundRegistry) {
    super();
  }

  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    const stopped = this.sounds.stopAll();
    this.log.info(stopped ? `Stopped ${stopped} active sound(s)` : "Stop pressed: no active sounds");
    await ev.action.showOk();
  }
}
