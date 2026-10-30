# StreamBoard – Benutzerhandbuch

🌐 [English](en.md) · [Français](fr.md) · [Español](es.md) · [Italiano](it.md) · **Deutsch** · [Nederlands](nl.md)

StreamBoard macht dein Stream Deck zum Soundboard. Jede Taste spielt einen Sound aus einer Datei auf deinem Computer oder von einer Webadresse (URL) ab – auf dem Audioausgang deiner Wahl.

## Voraussetzungen

- Windows 10 oder neuer bzw. macOS 12 oder neuer
- Stream Deck Software 7.1 oder neuer

Sonst musst du nichts installieren: Die Audio-Engine ist im Plugin enthalten.

## Installation

1. Lade die neueste `.streamDeckPlugin`-Datei von der [Releases-Seite](https://github.com/BKNadir/streamboard/releases) herunter.
2. Doppelklicke darauf. Stream Deck installiert das Plugin (oder aktualisiert es, falls es schon installiert ist).
3. Die Kategorie **StreamBoard** erscheint in der Aktionsliste rechts im Stream-Deck-Fenster.

## Einen Sound hinzufügen

1. Ziehe die Aktion **Play** aus der Kategorie StreamBoard auf eine Taste.
2. Wähle in den Einstellungen darunter den **Source Type**:
   - **Local file**: Klicke auf **…** und wähle eine Audiodatei aus.
   - **URL**: Füge einen direkten Link zu einer Audiodatei ein, zum Beispiel `https://example.com/applaus.mp3`.
3. Wähle die **Action** (das Verhalten der Taste, siehe unten), die Lautstärke (**Volume**) und den Ausgang (**Output**).
4. Drücke die Taste: Der Sound wird abgespielt.

Unterstützte Formate: **MP3, WAV, FLAC, OGG und AIFF**.

## Tastenmodi

| Modus | Was ein Tastendruck bewirkt |
|-------|-----------------------------|
| **Play / Stop** | Spielt den Sound ab. Erneutes Drücken während der Wiedergabe stoppt ihn. |
| **Play / Overlap** | Startet bei jedem Druck eine neue Kopie des Sounds, zusätzlich zu den bereits laufenden. |
| **Play / Restart** | Stoppt den Sound, falls er läuft, und startet ihn von vorne. |
| **Loop / Stop** | Spielt den Sound in einer Schleife. Erneutes Drücken stoppt ihn. |

Solange der Sound einer Taste läuft, **leuchtet** die Taste (farbiger Hintergrund mit Equalizer). Wenn der Sound endet, sieht sie wieder normal aus.

## Lautstärke

Jede Taste hat ihre eigene Lautstärke von 0 bis 100 %. Sie wirkt zusätzlich zur Systemlautstärke.

## Audioausgang

Die Einstellung **Output** gilt **für alle StreamBoard-Tasten gemeinsam**:

- Ändere sie auf einer beliebigen Taste, und alle Tasten verwenden ab dem nächsten Druck den neuen Ausgang.
- Neue Tasten übernehmen automatisch den bereits gewählten Ausgang.
- **System Default** folgt dem Standardausgang deines Computers.

Mit der Aktualisieren-Schaltfläche neben der Liste lädst du sie neu, zum Beispiel nachdem du ein Headset angeschlossen hast. Ist der gewählte Ausgang nicht mehr verfügbar, werden die Sounds auf dem Standardausgang abgespielt.

> Tipp: Um Sounds an deinen Stream zu senden, ohne sie doppelt zu hören, wähle ein virtuelles Audiogerät als Ausgang (zum Beispiel ein virtuelles Kabel oder die Kanäle von Elgato Wave Link).

## Alle Sounds stoppen

Ziehe die Aktion **Stop** auf eine Taste. Ein Druck darauf stoppt alle Sounds, die StreamBoard gerade abspielt, auf allen Tasten.

## Sounds von einer URL

- Die Datei wird **nur einmal** heruntergeladen und in einem lokalen Cache gespeichert. Der Download beginnt, sobald du die URL einfügst, daher wird der Sound schon beim ersten Druck sofort abgespielt.
- Der Link muss direkt auf eine Audiodatei zeigen (nicht auf eine Webseite mit einem Player).
- Grenzen: 50 MB pro Datei, 30 Sekunden für den Download.
- Cache-Ordner: `%TEMP%\streamboard` unter Windows, `$TMPDIR/streamboard` unter macOS. Dateien, die 30 Tage lang nicht verwendet wurden, werden automatisch gelöscht.

## Fehlerbehebung

Ein **Warndreieck** auf der Taste bedeutet, dass der Sound nicht abgespielt werden konnte. Häufige Ursachen:

| Ursache | Lösung |
|---------|--------|
| Keine Datei oder URL eingestellt | Öffne die Einstellungen der Taste und wähle eine Quelle. |
| Die Datei wurde verschoben oder gelöscht | Wähle die Datei erneut aus. |
| Die URL lässt sich nicht herunterladen | Prüfe den Link im Browser: Er muss direkt eine Audiodatei herunterladen. |
| Format nicht unterstützt | Wandle die Datei in MP3 oder WAV um (zum Beispiel mit [Audacity](https://www.audacityteam.org/)). |
| Kein Audioausgang verfügbar | Prüfe, ob ein Audiogerät angeschlossen und aktiviert ist. |

**Logs** (hilfreich, wenn du ein Problem meldest):

- Windows: `%APPDATA%\Elgato\StreamDeck\Plugins\com.bknadir.streamboard.sdPlugin\logs`
- macOS: `~/Library/Application Support/com.elgato.StreamDeck/Plugins/com.bknadir.streamboard.sdPlugin/logs`

Melde Probleme auf der [Issues-Seite](https://github.com/BKNadir/streamboard/issues) und hänge die Logs an.

## Aus dem Quellcode bauen

Du brauchst [Node.js](https://nodejs.org/) 24 oder neuer.

```bash
git clone https://github.com/BKNadir/streamboard.git
cd streamboard
npm install
npm run build
npx streamdeck link com.bknadir.streamboard.sdPlugin
```

- `npm run watch` baut das Plugin bei jeder Änderung neu und startet es neu.
- `npm run typecheck` prüft den Code, ohne zu bauen.
- Jeder Push auf GitHub baut das Plugin automatisch: Die installationsfertige `.streamDeckPlugin`-Datei findest du im Bereich **Artifacts** des jeweiligen Laufs im Tab **Actions**.
