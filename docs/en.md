# StreamBoard – User guide

🌐 **English** · [Français](fr.md) · [Español](es.md) · [Italiano](it.md) · [Deutsch](de.md) · [Nederlands](nl.md)

StreamBoard turns your Stream Deck into a soundboard. Each key plays a sound from a file on your computer or from a web address (URL), on the audio output of your choice.

## Requirements

- Windows 10 or later, or macOS 12 or later
- Stream Deck software 7.1 or later

Nothing else to install: the audio engine is included in the plugin.

## Installation

1. Download the latest `.streamDeckPlugin` file from the [Releases page](https://github.com/BKNadir/streamboard/releases).
2. Double-click it. Stream Deck installs the plugin (or updates it if it is already installed).
3. The **StreamBoard** category appears in the action list on the right of the Stream Deck window.

## Add a sound

1. Drag the **Play** action from the StreamBoard category onto a key.
2. In the settings below, choose the **Source Type**:
   - **Local file**: click **…** and select an audio file.
   - **URL**: paste a direct link to an audio file, for example `https://example.com/applause.mp3`.
3. Choose the **Action** (how the key behaves, see below), the **Volume** and the **Output**.
4. Press the key: the sound plays.

Supported formats: **MP3, WAV, FLAC, OGG and AIFF**.

## Key modes

| Mode | What a press does |
|------|-------------------|
| **Play / Stop** | Plays the sound. Pressing again while it plays stops it. |
| **Play / Overlap** | Starts a new copy of the sound on every press, on top of the ones already playing. |
| **Play / Restart** | Stops the sound if it is playing and starts it again from the beginning. |
| **Loop / Stop** | Plays the sound in a loop. Pressing again stops it. |

While a key's sound is playing, a **green frame** appears around the key, so you can see what is playing. It disappears when the sound ends.

## Volume

Each key has its own volume, from 0 to 100 %. It is applied on top of your system volume.

## Audio output

The **Output** setting is **shared by all StreamBoard keys**:

- Change it on any key and every key uses the new output from the next press.
- New keys automatically use the output already selected.
- **System Default** follows the default output of your computer.

The refresh button next to the list updates it, for example after plugging in a headset. If the selected output is no longer available, sounds play on the default output instead.

> Tip: to send sounds to your stream without hearing them twice, select a virtual audio device (for example a virtual cable or the Elgato Wave Link channels) as output.

## Stop all sounds

Drag the **Stop** action onto a key. Pressing it stops every sound currently played by StreamBoard, on every key.

## Sounds from a URL

- The file is downloaded **once** and kept in a local cache. The download starts as soon as you paste the URL, so the first press plays instantly.
- The link must point directly to an audio file (not to a web page that contains a player).
- Limits: 50 MB per file, 30 seconds to download.
- Cache folder: `%TEMP%\streamboard` on Windows, `$TMPDIR/streamboard` on macOS. Files that have not been used for 30 days are deleted automatically.

## Troubleshooting

A **warning triangle** on the key means the sound could not be played. Common causes:

| Cause | Solution |
|-------|----------|
| No file or URL set | Open the key settings and choose a source. |
| The file was moved or deleted | Select the file again. |
| The URL cannot be downloaded | Check the link in a browser; it must download an audio file directly. |
| Unsupported format | Convert the file to MP3 or WAV (for example with [Audacity](https://www.audacityteam.org/)). |
| No audio output available | Check that an audio device is connected and enabled. |

**Logs** (useful when reporting a problem):

- Windows: `%APPDATA%\Elgato\StreamDeck\Plugins\com.bknadir.streamboard.sdPlugin\logs`
- macOS: `~/Library/Application Support/com.elgato.StreamDeck/Plugins/com.bknadir.streamboard.sdPlugin/logs`

Report problems on the [Issues page](https://github.com/BKNadir/streamboard/issues), with the logs attached.

## Build from source

You need [Node.js](https://nodejs.org/) 24 or later.

```bash
git clone https://github.com/BKNadir/streamboard.git
cd streamboard
npm install
npm run build
npx streamdeck link com.bknadir.streamboard.sdPlugin
```

- `npm run watch` rebuilds and restarts the plugin on every change.
- `npm run typecheck` checks the code without building.
- Every push on GitHub builds the plugin automatically: the ready-to-install `.streamDeckPlugin` file is available in the **Artifacts** section of the corresponding run in the **Actions** tab.
