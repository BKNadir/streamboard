# StreamBoard – Stream Deck soundboard plugin

Turn your Stream Deck into a soundboard: play local audio files or direct URLs, pick the output device, set the volume and choose how each key behaves.

## Features

- Play **local audio files** (MP3, WAV, OGG, FLAC… anything mpv reads) or **direct URLs**
- URL sounds are downloaded once, cached, and **pre-loaded** as soon as the key appears, so the first press plays instantly
- **Volume** per key (0–100 %)
- **Output device** per key (e.g. send a sound to your headset or to a virtual cable for your stream)
- Four **key modes**:

  | Mode | Behaviour |
  |------|-----------|
  | Play / Stop | Press to play, press again to stop |
  | Play / Overlap | Every press starts a new copy on top of the others |
  | Play / Restart | Every press restarts the sound from the beginning |
  | Loop / Stop | Press to loop, press again to stop |

- The key **lights up while its sound is playing**
- A **Stop** action that stops every sound played by the plugin

## Installation

### From the Stream Deck Marketplace

Coming soon.

### From a release

Download the latest `.streamDeckPlugin` file from the [Releases](https://github.com/BKNadir/streamboard/releases) page and double-click it.

### From source

```bash
git clone https://github.com/BKNadir/streamboard.git
cd streamboard
npm install
npm run build
npx streamdeck link com.bknadir.streamboard.sdPlugin
```

During development, `npm run watch` rebuilds and restarts the plugin on every change. `npm run typecheck` checks the TypeScript without building.

## Requirements

Windows 10 or later. mpv is bundled with the plugin, nothing else to install.

### Advanced settings (environment variables)

| Variable | Purpose |
|----------|---------|
| `STREAMBOARD_MPV_PATH` | Use a specific mpv executable |
| `STREAMBOARD_CACHE_DIR` | Where downloaded URL sounds are cached (default: system temp folder). Files unused for 30 days are removed automatically |
| `STREAMBOARD_LOG_LEVEL` | Set to `debug` for verbose logs |

## Third-party dependencies

StreamBoard uses [mpv](https://github.com/mpv-player/mpv) for audio playback. mpv is licensed under the GPLv3; see its repository for source code and license information.

## License

MIT – see [LICENSE](LICENSE).

Plugin developed by bknadir in my free time.

## Support the project

If you find this project useful and would like to support its development:

[![Donate with PayPal](https://www.paypalobjects.com/en_US/BE/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/donate/?hosted_button_id=75FUAAH35LBV8)

Support is never required, but it helps keep the project active and up to date.
