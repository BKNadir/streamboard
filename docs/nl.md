# StreamBoard – Handleiding

🌐 [English](en.md) · [Français](fr.md) · [Español](es.md) · [Italiano](it.md) · [Deutsch](de.md) · **Nederlands**

StreamBoard maakt van je Stream Deck een soundboard. Elke toets speelt een geluid af uit een bestand op je computer of van een webadres (URL), op de audio-uitgang van je keuze.

## Vereisten

- Windows 10 of nieuwer, of macOS 12 of nieuwer
- Stream Deck-software 7.1 of nieuwer

Verder hoef je niets te installeren: de audio-engine zit in de plugin.

## Installatie

1. Download het nieuwste `.streamDeckPlugin`-bestand van de [Releases-pagina](https://github.com/BKNadir/streamboard/releases).
2. Dubbelklik erop. Stream Deck installeert de plugin (of werkt hem bij als hij al geïnstalleerd is).
3. De categorie **StreamBoard** verschijnt in de lijst met acties, rechts in het Stream Deck-venster.

## Een geluid toevoegen

1. Sleep de actie **Play** uit de categorie StreamBoard naar een toets.
2. Kies in de instellingen eronder het **Source Type**:
   - **Local file**: klik op **…** en selecteer een audiobestand.
   - **URL**: plak een directe link naar een audiobestand, bijvoorbeeld `https://example.com/applaus.mp3`.
3. Kies de **Action** (het gedrag van de toets, zie hieronder), het volume (**Volume**) en de uitgang (**Output**).
4. Druk op de toets: het geluid wordt afgespeeld.

Ondersteunde formaten: **MP3, WAV, FLAC, OGG en AIFF**.

## Toetsmodi

| Modus | Wat een druk doet |
|-------|-------------------|
| **Play / Stop** | Speelt het geluid af. Opnieuw drukken tijdens het afspelen stopt het. |
| **Play / Overlap** | Start bij elke druk een nieuwe kopie van het geluid, bovenop de geluiden die al spelen. |
| **Play / Restart** | Stopt het geluid als het speelt en start het opnieuw vanaf het begin. |
| **Loop / Stop** | Speelt het geluid in een lus. Opnieuw drukken stopt het. |

Zolang het geluid van een toets speelt, **licht de toets op** (gekleurde achtergrond met een equalizer). Als het geluid afgelopen is, ziet de toets er weer normaal uit.

## Volume

Elke toets heeft een eigen volume, van 0 tot 100 %. Het komt bovenop het systeemvolume.

## Audio-uitgang

De instelling **Output** is **gedeeld door alle StreamBoard-toetsen**:

- Wijzig ze op een willekeurige toets en alle toetsen gebruiken vanaf de volgende druk de nieuwe uitgang.
- Nieuwe toetsen gebruiken automatisch de uitgang die al gekozen is.
- **System Default** volgt de standaarduitgang van je computer.

Met de vernieuwknop naast de lijst laad je die opnieuw, bijvoorbeeld nadat je een headset hebt aangesloten. Is de gekozen uitgang niet meer beschikbaar, dan worden de geluiden op de standaarduitgang afgespeeld.

> Tip: om geluiden naar je stream te sturen zonder ze dubbel te horen, kies je een virtuele audio-uitgang (bijvoorbeeld een virtuele kabel of de kanalen van Elgato Wave Link).

## Alle geluiden stoppen

Sleep de actie **Stop** naar een toets. Als je erop drukt, stoppen alle geluiden die StreamBoard afspeelt, op alle toetsen.

## Geluiden van een URL

- Het bestand wordt **één keer** gedownload en in een lokale cache bewaard. Het downloaden begint zodra je de URL plakt, dus de eerste druk speelt meteen.
- De link moet rechtstreeks naar een audiobestand wijzen (niet naar een webpagina met een speler).
- Limieten: 50 MB per bestand, 30 seconden om te downloaden.
- Cachemap: `%TEMP%\streamboard` op Windows, `$TMPDIR/streamboard` op macOS. Bestanden die 30 dagen niet gebruikt zijn, worden automatisch verwijderd.

## Problemen oplossen

Een **waarschuwingsdriehoek** op de toets betekent dat het geluid niet kon worden afgespeeld. Veelvoorkomende oorzaken:

| Oorzaak | Oplossing |
|---------|-----------|
| Geen bestand of URL ingesteld | Open de instellingen van de toets en kies een bron. |
| Het bestand is verplaatst of verwijderd | Selecteer het bestand opnieuw. |
| De URL kan niet gedownload worden | Controleer de link in een browser: die moet direct een audiobestand downloaden. |
| Formaat niet ondersteund | Zet het bestand om naar MP3 of WAV (bijvoorbeeld met [Audacity](https://www.audacityteam.org/)). |
| Geen audio-uitgang beschikbaar | Controleer of er een audioapparaat aangesloten en ingeschakeld is. |

**Logs** (handig als je een probleem meldt):

- Windows: `%APPDATA%\Elgato\StreamDeck\Plugins\com.bknadir.streamboard.sdPlugin\logs`
- macOS: `~/Library/Application Support/com.elgato.StreamDeck/Plugins/com.bknadir.streamboard.sdPlugin/logs`

Meld problemen op de [Issues-pagina](https://github.com/BKNadir/streamboard/issues) en voeg de logs toe.

## Bouwen vanaf de broncode

Je hebt [Node.js](https://nodejs.org/) 24 of nieuwer nodig.

```bash
git clone https://github.com/BKNadir/streamboard.git
cd streamboard
npm install
npm run build
npx streamdeck link com.bknadir.streamboard.sdPlugin
```

- `npm run watch` bouwt de plugin opnieuw en herstart hem bij elke wijziging.
- `npm run typecheck` controleert de code zonder te bouwen.
- Elke push op GitHub bouwt de plugin automatisch: het installatieklare `.streamDeckPlugin`-bestand staat in de sectie **Artifacts** van de bijbehorende run, op het tabblad **Actions**.
