# StreamBoard – Guida all'uso

🌐 [English](en.md) · [Français](fr.md) · [Español](es.md) · **Italiano** · [Deutsch](de.md) · [Nederlands](nl.md)

StreamBoard trasforma il tuo Stream Deck in una soundboard. Ogni tasto riproduce un suono da un file del tuo computer o da un indirizzo web (URL), sull'uscita audio che preferisci.

## Requisiti

- Windows 10 o successivo, oppure macOS 12 o successivo
- Software Stream Deck 7.1 o successivo

Non serve installare altro: il motore audio è incluso nel plugin.

## Installazione

1. Scarica l'ultimo file `.streamDeckPlugin` dalla [pagina delle Releases](https://github.com/BKNadir/streamboard/releases).
2. Fai doppio clic sul file. Stream Deck installa il plugin (o lo aggiorna se è già installato).
3. La categoria **StreamBoard** compare nell'elenco delle azioni, a destra della finestra di Stream Deck.

## Aggiungere un suono

1. Trascina l'azione **Play** della categoria StreamBoard su un tasto.
2. Nelle impostazioni qui sotto, scegli il **Source Type**:
   - **Local file**: fai clic su **…** e seleziona un file audio.
   - **URL**: incolla un link diretto a un file audio, per esempio `https://example.com/applausi.mp3`.
3. Scegli l'**Action** (il comportamento del tasto, vedi sotto), il **Volume** e l'uscita (**Output**).
4. Premi il tasto: il suono viene riprodotto.

Formati supportati: **MP3, WAV, FLAC, OGG e AIFF**.

## Modalità dei tasti

| Modalità | Cosa fa una pressione |
|----------|-----------------------|
| **Play / Stop** | Riproduce il suono. Premendo di nuovo durante la riproduzione, lo ferma. |
| **Play / Overlap** | Avvia una nuova copia del suono a ogni pressione, sopra quelle già in riproduzione. |
| **Play / Restart** | Ferma il suono se è in riproduzione e lo fa ripartire dall'inizio. |
| **Loop / Stop** | Riproduce il suono in loop. Premendo di nuovo, lo ferma. |

## Volume

Ogni tasto ha il proprio volume, da 0 a 100 %. Si applica in aggiunta al volume di sistema.

## Uscita audio

L'impostazione **Output** è **condivisa da tutti i tasti StreamBoard**:

- Modificala su un tasto qualsiasi e tutti i tasti useranno la nuova uscita dalla pressione successiva.
- I nuovi tasti usano automaticamente l'uscita già selezionata.
- **System Default** segue l'uscita predefinita del tuo computer.

Il pulsante di aggiornamento accanto all'elenco lo ricarica, per esempio dopo aver collegato delle cuffie. Se l'uscita scelta non è più disponibile, i suoni vengono riprodotti sull'uscita predefinita.

> Suggerimento: per inviare i suoni alla tua diretta senza sentirli due volte, scegli un'uscita audio virtuale (per esempio un cavo virtuale o i canali di Elgato Wave Link).

## Fermare tutti i suoni

Trascina l'azione **Stop** su un tasto. Premendolo si fermano tutti i suoni riprodotti da StreamBoard, su tutti i tasti.

## Suoni da un URL

- Il file viene scaricato **una sola volta** e conservato in una cache locale. Il download parte non appena incolli l'URL, quindi la prima pressione suona subito.
- Il link deve puntare direttamente a un file audio (non a una pagina web con un lettore).
- Limiti: 50 MB per file, 30 secondi per il download.
- Cartella della cache: `%TEMP%\streamboard` su Windows, `$TMPDIR/streamboard` su macOS. I file non usati da 30 giorni vengono eliminati automaticamente.

## Risoluzione dei problemi

Un **triangolo di avviso** sul tasto indica che il suono non è stato riprodotto. Cause frequenti:

| Causa | Soluzione |
|-------|-----------|
| Nessun file o URL impostato | Apri le impostazioni del tasto e scegli una sorgente. |
| Il file è stato spostato o eliminato | Seleziona di nuovo il file. |
| L'URL non si può scaricare | Controlla il link in un browser: deve scaricare direttamente un file audio. |
| Formato non supportato | Converti il file in MP3 o WAV (per esempio con [Audacity](https://www.audacityteam.org/)). |
| Nessuna uscita audio disponibile | Verifica che un dispositivo audio sia collegato e attivo. |

**Log** (utili per segnalare un problema):

- Windows: `%APPDATA%\Elgato\StreamDeck\Plugins\com.bknadir.streamboard.sdPlugin\logs`
- macOS: `~/Library/Application Support/com.elgato.StreamDeck/Plugins/com.bknadir.streamboard.sdPlugin/logs`

Segnala i problemi nella [pagina delle Issues](https://github.com/BKNadir/streamboard/issues), allegando i log.

## Compilare dai sorgenti

Serve [Node.js](https://nodejs.org/) 24 o successivo.

```bash
git clone https://github.com/BKNadir/streamboard.git
cd streamboard
npm install
npm run build
npx streamdeck link com.bknadir.streamboard.sdPlugin
```

- `npm run watch` ricompila e riavvia il plugin a ogni modifica.
- `npm run typecheck` controlla il codice senza compilare.
- Ogni push su GitHub compila automaticamente il plugin: il file `.streamDeckPlugin` pronto da installare si trova nella sezione **Artifacts** dell'esecuzione corrispondente, nella scheda **Actions**.
