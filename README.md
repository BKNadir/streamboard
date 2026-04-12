StreamBoard - Stream Deck Audio Plugin
Stream Deck plugin for advanced audio playback with support for local files and URLs, volume control, and multi-output management.

Features
Audio playback of local MP3 files and remote URLs

Volume control (0-100%)

Loop/repeat mode

Specific audio device support (WIP)

Modern Property Inspector interface

Play/Stop Sound actions

Installation
From Stream Deck Store (Recommended)
Open Stream Deck

Go to Store → Search "StreamBoard"

Click Install

Manual Installation
bash
# Clone the repo
git clone https://github.com/bknadir/streamboard-streamdeck.git
cd streamboard-streamdeck

# Build
npm install
npm run build

# Package
npx @elgato/cli streamdeck pack
Install the generated .streamDeckPlugin in ~/.streamDeckPlugins/.

Project Structure
text
com.bknadir.streamboard.sdPlugin/
├── manifest.json          # Stream Deck configuration
├── bin/
│   ├── plugin.js          # Main compiled code
│   └── tools/
│       └── ffplay.exe     # Embedded audio player
├── src/
│   ├── index.ts           # Main entry point
│   └── actions/
│       ├── play-sound.ts  # Play action
│       └── stop-sound.ts  # Stop action
├── ui/
│   └── property-inspector/
│       └── index.html     # Settings interface
└── tsconfig.json
Configuration
Available Actions
Action	Description
Play Sound	Plays local or URL audio file
Stop Sound	Stops currently playing sound
Play Sound Settings
text
Source Type       [File | URL]
File Path         C:/path/to/sound.mp3
URL               https://example.com/sound.mp3
Volume            [0-100]%
Loop              [ ] Repeat
Audio Device      [Default | Speakers | Headphones]
Development
Prerequisites
bash
npm install -g @elgato/cli
Scripts
bash
npm run build      # Compile TypeScript
npm run watch      # Watch mode + auto-reload Stream Deck
npm run pack       # Create .streamDeckPlugin
TypeScript Structure
ts
// src/actions/play-sound.ts
export class PlaySoundAction extends SingletonAction<PlaySoundSettings> {
  constructor(private readonly audioService: AudioService) {
    super();
  }
  
  override onKeyDown(ev: KeyDownEvent<PlaySoundSettings>): void {
    this.audioService.play({
      source: settings.sourceType === "file" ? settings.filePath : settings.url,
      volume: settings.volume ?? 1,
      loop: settings.loop ?? false
    });
  }
}
Property Inspector
Uses modern HTML/CSS/JS with Elgato's Property Inspector SDK:

xml
<!DOCTYPE html>
<html>
<head>
  <script src="https://assets.elgato.com/propertyinspector/PI.js"></script>
</head>
<body>
  <div class="form-group">
    <label>Source Type</label>
    <select id="sourceType">
      <option value="file">Local File</option>
      <option value="url">Remote URL</option>
    </select>
  </div>
</body>
</html>
Platform Support
Platform	Status	Audio Binary
Windows	Stable	ffplay.exe
macOS	In Progress	ffplay
Linux	Planned	ffplay
Audio Backend
Uses embedded ffplay.exe for:

Local/URL playback

Volume control via FFmpeg filters

Silent mode (-nodisp)

bash
ffplay.exe -nodisp -autoexit -af "volume=0.5" "sound.mp3"
Troubleshooting
Plugin Won't Load
text
1. Check manifest.json (SDKVersion, CodePath)
2. npm run build
3. npx @elgato/cli streamdeck pack
Audio Not Playing
text
1. Verify ffplay.exe path in bin/tools/
2. Test manually: bin/tools/ffplay.exe -nodisp "test.mp3"
3. Check Windows Defender permissions
Property Inspector Empty
text
1. Verify PropertyInspectorPath in manifest.json
2. Restart Stream Deck
Contributing
bash
# Fork & clone
git clone https://github.com/YOUR_USERNAME/streamboard-streamdeck.git
cd streamboard-streamdeck

# Install
npm install

# Dev mode
npm run watch
License
MIT License - see LICENSE

Acknowledgments
Elgato Stream Deck SDK

FFmpeg/ffplay

TypeScript

Plugin developed by bknadir - Software Development Student