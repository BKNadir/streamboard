import { execFile } from "node:child_process";
import { resolveMpvPath } from "./actions/player";

export type AudioDeviceOption = { label: string; value: string };

type Logger = {
  warn: (...args: unknown[]) => unknown;
  error: (...args: unknown[]) => unknown;
};

type WindowsDevice = {
  id: string;
  name?: string;
  interfaceName?: string;
  isActive: boolean;
};

const CACHE_TTL_MS = 30_000;
let cache: { at: number; items: AudioDeviceOption[] } | undefined;

/**
 * Lists the audio outputs mpv can play to. Results are cached briefly because
 * the property inspector asks every time it opens.
 */
export async function listAudioOutputs(log: Logger, force = false): Promise<AudioDeviceOption[]> {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.items;
  }

  const items =
    process.platform === "win32" ? await listWindowsOutputs(log) : await listMpvOutputs(log);
  cache = { at: Date.now(), items };
  return items;
}

const WINDOWS_SCRIPT = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Get-ChildItem "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\MMDevices\\Audio\\Render" | ForEach-Object {
    $deviceKey = $_
    $device = Get-ItemProperty $deviceKey.PSPath
    $props = Get-ItemProperty "$($deviceKey.PSPath)\\Properties" -ErrorAction SilentlyContinue

    $friendlyName = $props.'{a45c254e-df1c-4efd-8020-67d146a850e0},14'
    $deviceDesc = $props.'{a45c254e-df1c-4efd-8020-67d146a850e0},2'
    $interfaceName = $props.'{b3f8fa53-0004-438e-9003-51a46e139bfc},6'

    [PSCustomObject]@{
        id = $deviceKey.PSChildName
        name = if ($friendlyName) { $friendlyName } elseif ($deviceDesc) { $deviceDesc } else { $interfaceName }
        interfaceName = $interfaceName
        isActive = ($device.DeviceState -eq 1)
    }
} | Where-Object { $_.name } | ConvertTo-Json -Compress
`;

function listWindowsOutputs(log: Logger): Promise<AudioDeviceOption[]> {
  return new Promise((resolve) => {
    execFile(
      "powershell",
      ["-NoProfile", "-NonInteractive", "-Command", WINDOWS_SCRIPT],
      { encoding: "utf8", windowsHide: true, timeout: 10_000 },
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
          resolve([]);
          return;
        }

        try {
          const parsed = JSON.parse(stdout) as WindowsDevice | WindowsDevice[];
          const devices = (Array.isArray(parsed) ? parsed : [parsed]).filter((d) => d?.isActive);
          resolve(
            devices.map((device) => ({
              label: formatWindowsLabel(device),
              value: `wasapi/${device.id}`,
            })),
          );
        } catch (parseError) {
          log.error(`Failed to parse PowerShell JSON: ${stdout}`, parseError);
          resolve([]);
        }
      },
    );
  });
}

export function formatWindowsLabel(device: Pick<WindowsDevice, "name" | "interfaceName">): string {
  const parts = [device.name, device.interfaceName].filter(
    (part, index, all): part is string => !!part && all.indexOf(part) === index,
  );
  // e.g. "Speakers (Realtek High Definition Audio)"
  return parts.length === 2 ? `${parts[0]} (${parts[1]})` : parts[0] ?? "Unknown device";
}

/** Uses `mpv --audio-device=help`, which lists exactly the ids mpv accepts. */
function listMpvOutputs(log: Logger): Promise<AudioDeviceOption[]> {
  const mpv = resolveMpvPath();
  if (!mpv) {
    return Promise.resolve([]);
  }

  return new Promise((resolve) => {
    execFile(mpv, ["--audio-device=help"], { encoding: "utf8", timeout: 10_000 }, (error, stdout) => {
      if (error && !stdout) {
        log.warn("mpv device discovery failed", error);
        resolve([]);
        return;
      }
      resolve(parseMpvDeviceList(stdout));
    });
  });
}

export function parseMpvDeviceList(output: string): AudioDeviceOption[] {
  const items: AudioDeviceOption[] = [];
  for (const line of output.split(/\r?\n/)) {
    const match = /^\s*'([^']+)'\s+\((.*)\)\s*$/.exec(line);
    if (match && match[1] !== "auto") {
      items.push({ value: match[1], label: match[2] || match[1] });
    }
  }
  return items;
}
