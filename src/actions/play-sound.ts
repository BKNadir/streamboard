import streamDeck, {
	action,
	KeyDownEvent,
	SingletonAction,
	type SendToPluginEvent,
} from "@elgato/streamdeck";
import { execFile } from "node:child_process";
import { Player } from "./player";

streamDeck.logger.setLevel("info");

type Settings = {
    volume?: number;
    sourceType?: "file" | "url";
    sourceFile?: string;
    sourceUrl?: string;
    mode?: "play_stop" | "play_overlap" | "play_restart" | "loop_stop";
    outputTarget?: string;
};

type AudioOutputDevice = {
    id: string;
	name: string;
	friendlyName?: string;
	deviceDesc?: string;
	interfaceName?: string;
	isActive: boolean;
};

function detectWinOutput(log: typeof streamDeck.logger): Promise<AudioOutputDevice[]> {
    if (process.platform !== "win32") {
        return Promise.resolve([]);
    }

    const script = `
    $devices = Get-ChildItem "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\MMDevices\\Audio\\Render" | ForEach-Object {
        $deviceKey = $_
        $deviceId = $deviceKey.PSChildName
        $device = Get-ItemProperty $deviceKey.PSPath
        $props = Get-ItemProperty "$($deviceKey.PSPath)\\Properties" -ErrorAction SilentlyContinue

        $friendlyName = $props.'{a45c254e-df1c-4efd-8020-67d146a850e0},14'
        $deviceDesc = $props.'{a45c254e-df1c-4efd-8020-67d146a850e0},2'
        $interfaceName = $props.'{b3f8fa53-0004-438e-9003-51a46e139bfc},6'

        [PSCustomObject]@{
            id = $deviceId
            name = if ($friendlyName) { $friendlyName } elseif ($deviceDesc) { $deviceDesc } else { $interfaceName }
            friendlyName = $friendlyName
            deviceDesc = $deviceDesc
            interfaceName = $interfaceName
            isActive = ($device.DeviceState -eq 1)
        }
    } | Where-Object { $_.name } | ConvertTo-Json -Compress
    $devices
    `;

    return new Promise((resolve) => {
        execFile(
            "powershell",
            ["-NoProfile", "-Command", script],
            { encoding: "utf8" },
            (error, stdout, stderr) => {
                if (error) {
                    log.error("PowerShell device discovery failed", error);
                    resolve([]);
                    return;
                }

                if (stderr?.trim()) {
                    log.warn(`PowerShell stderr: ${stderr.trim()}`);
                }

                if (!stdout?.trim()) {
                    log.warn("PowerShell returned empty stdout");
                    resolve([]);
                    return;
                }

                try {
                    const parsed = JSON.parse(stdout);
                    const devices = Array.isArray(parsed) ? parsed : [parsed];
                    resolve(devices.filter((d) => d?.isActive));
                } catch (parseError) {
                    log.error(`Failed to parse PowerShell JSON: ${stdout}`, parseError);
                    resolve([]);
                }
            }
        );
    });
}

@action({ UUID: "com.bknadir.streamboard.play" })
export class PlaySoundAction extends SingletonAction<Settings> {
    private readonly log = streamDeck.logger.createScope("PlaySoundAction");

    constructor(private readonly playingSounds: Record<string, any>) {
        super();
        this.log.info("PlaySoundAction initialized");
    }

    override onKeyDown(ev: KeyDownEvent<Settings>): void | Promise<void> {
        const settings = ev.payload.settings;
        this.log.debug(`onKeyDown settings: ${JSON.stringify(settings ?? {})}`);

        const source = settings.sourceType === "url" ? settings.sourceUrl : settings.sourceFile;

        if (!source) {
            this.log.error("No audio source available to play");
            ev.action.showAlert();
            return;
        }

        const mode = settings.mode ?? "play_stop";
        const sameActionKeys = Object.keys(this.playingSounds).filter((id) =>
            id.startsWith(ev.action.coordinates?.column + "-" + ev.action.coordinates?.row),
        );

        this.log.debug(`Mode=${mode}, source=${source}, sameActionKeys=${sameActionKeys.join(",")}`);

        if (mode === "play_stop" && sameActionKeys.length > 0) {
            sameActionKeys.forEach((key) => {
                this.playingSounds[key].stop();
                delete this.playingSounds[key];
            });
            this.log.info("Stopped currently playing sound(s) in play_stop mode");
            ev.action.showOk();
            return;
        }

        if (mode === "play_restart" && sameActionKeys.length > 0) {
            sameActionKeys.forEach((key) => {
                this.playingSounds[key].stop();
                delete this.playingSounds[key];
            });
            this.log.info("Restarting sound(s) in play_restart mode");
        }

        if (mode === "loop_stop" && sameActionKeys.length > 0) {
            sameActionKeys.forEach((key) => {
                this.playingSounds[key].stop();
                delete this.playingSounds[key];
            });
            this.log.info("Stopped loop in loop_stop mode");
            ev.action.showOk();
            return;
        }

        const playerId = `${ev.action.coordinates?.column + "-" + ev.action.coordinates?.row}`;
        const player = new Player(playerId, source, {
            volume: settings.volume ?? 100,
            loop: mode === "loop_stop",
            audioDevice: settings.outputTarget && settings.outputTarget !== "default"
                ? settings.outputTarget
                : undefined,
        });
        this.log.debug(settings);

        this.log.info(`Creating player ${playerId} with outputTarget=${settings.outputTarget ?? "default"}`);

        player.on("playerror", (_id, error) => {
            this.log.error(`Error playing sound (${playerId})`, error);
            delete this.playingSounds[playerId];
            ev.action.showAlert();
        });

        player.on("end", () => {
            this.log.info(`Playback ended for ${playerId}`);
            delete this.playingSounds[playerId];
        });

        this.playingSounds[playerId] = player;
        player.play();

        this.log.info(`Playback started for ${playerId}`);
        ev.action.showOk();
    }

    override async onSendToPlugin(ev: SendToPluginEvent<{ event?: string }, Settings>): Promise<void> {
        if (ev.payload?.event !== "getAudioDevices") {
            return;
        }

        const devices = await detectWinOutput(this.log);

        this.log.info(`Audio devices ready for PI: ${JSON.stringify(devices)}`);

        await streamDeck.ui.sendToPropertyInspector({
            event: "getAudioDevices",
            items: [
                { label: "System Default", value: "default" },
                ...devices.map((device) => ({
                    label: device.name + ' ' + device.interfaceName || "Unknown Device",
                    value: `wasapi/${device.id}`,
                })),
            ],
        });
    }
}