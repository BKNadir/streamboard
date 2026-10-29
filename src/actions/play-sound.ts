import streamDeck, {
  action,
  type DidReceiveSettingsEvent,
  type KeyDownEvent,
  SingletonAction,
  type SendToPluginEvent,
  type WillAppearEvent,
} from "@elgato/streamdeck";
import { listAudioOutputs } from "../audio-devices";
import type { SoundRegistry } from "../sound-registry";
import { Downloader } from "./downloader";
import { Player } from "./player";

export type PlayMode = "play_stop" | "play_overlap" | "play_restart" | "loop_stop";

type Settings = {
  volume?: number;
  sourceType?: "file" | "url";
  sourceFile?: string;
  sourceUrl?: string;
  mode?: PlayMode;
  outputTarget?: string;
};

/** Key states declared in manifest.json. */
const STATE_IDLE = 0;
const STATE_PLAYING = 1;

@action({ UUID: "com.bknadir.streamboard.play" })
export class PlaySoundAction extends SingletonAction<Settings> {
  private readonly log = streamDeck.logger.createScope("PlaySoundAction");

  constructor(
    private readonly sounds: SoundRegistry,
    private readonly downloader: Downloader,
  ) {
    super();

    // Reflect playback on the key: state 1 while something plays, state 0 otherwise.
    this.sounds.onChange((actionId, playing) => {
      const key = streamDeck.actions.getActionById(actionId);
      if (key?.isKey()) {
        key.setState(playing ? STATE_PLAYING : STATE_IDLE).catch(() => undefined);
      }
    });
  }

  override async onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> {
    if (ev.action.isKey()) {
      await ev.action.setState(this.sounds.isPlaying(ev.action.id) ? STATE_PLAYING : STATE_IDLE);
    }
    this.preload(ev.payload.settings);
  }

  override onDidReceiveSettings(ev: DidReceiveSettingsEvent<Settings>): void {
    this.preload(ev.payload.settings);
  }

  override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
    const settings = ev.payload.settings ?? {};
    const actionId = ev.action.id;
    const mode: PlayMode = settings.mode ?? "play_stop";
    const source = getSource(settings);

    // Toggle modes: a press while playing stops instead of starting again.
    if ((mode === "play_stop" || mode === "loop_stop") && this.sounds.isPlaying(actionId)) {
      const stopped = this.sounds.stopAction(actionId);
      this.log.info(`Stopped ${stopped} sound(s) on ${actionId} (${mode})`);
      return;
    }

    if (!source) {
      this.log.warn("No audio source configured");
      await ev.action.showAlert();
      return;
    }

    if (mode === "play_restart") {
      this.sounds.stopAction(actionId);
    }

    let playable = source;
    if (settings.sourceType === "url") {
      try {
        playable = await this.downloader.resolve(source);
      } catch (error) {
        this.log.error(`Failed to download ${source}`, error);
        await ev.action.showAlert();
        return;
      }
    }

    const outputTarget =
      settings.outputTarget && settings.outputTarget !== "default" ? settings.outputTarget : undefined;

    const player = new Player(actionId, playable, {
      volume: settings.volume ?? 100,
      loop: mode === "loop_stop",
      audioDevice: outputTarget,
    });

    player.once("end", () => {
      this.sounds.remove(actionId, player);
    });

    player.once("playerror", (_id, error) => {
      this.log.error(`Playback failed on ${actionId}`, error);
      this.sounds.remove(actionId, player);
      ev.action.showAlert().catch(() => undefined);
    });

    this.sounds.add(actionId, player);
    player.play();
    this.log.info(`Playing ${playable} on ${actionId} (mode=${mode}, output=${outputTarget ?? "default"})`);
  }

  override async onSendToPlugin(
    ev: SendToPluginEvent<{ event?: string; isRefresh?: boolean }, Settings>,
  ): Promise<void> {
    const payload = ev.payload ?? {};
    if (payload.event !== "getAudioDevices") {
      return;
    }

    const devices = await listAudioOutputs(this.log, payload.isRefresh === true);
    await streamDeck.ui.sendToPropertyInspector({
      event: "getAudioDevices",
      items: [{ label: "System Default", value: "default" }, ...devices],
    });
  }

  /** Downloads URL sources in the background so the first press plays instantly. */
  private preload(settings: Settings | undefined): void {
    const source = settings ? getSource(settings) : undefined;
    if (settings?.sourceType !== "url" || !source) {
      return;
    }
    this.downloader.resolve(source).catch((error) => {
      this.log.warn(`Preload failed for ${source}`, error);
    });
  }
}

function getSource(settings: Settings): string | undefined {
  const value = settings.sourceType === "url" ? settings.sourceUrl : settings.sourceFile;
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
