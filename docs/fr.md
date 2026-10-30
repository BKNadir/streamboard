# StreamBoard – Guide d'utilisation

🌐 [English](en.md) · **Français** · [Español](es.md) · [Italiano](it.md) · [Deutsch](de.md) · [Nederlands](nl.md)

StreamBoard transforme votre Stream Deck en soundboard. Chaque touche joue un son depuis un fichier de votre ordinateur ou depuis une adresse web (URL), sur la sortie audio de votre choix.

## Configuration requise

- Windows 10 ou plus récent, ou macOS 12 ou plus récent
- Logiciel Stream Deck 7.1 ou plus récent

Rien d'autre à installer : le moteur audio est inclus dans le plugin.

## Installation

1. Téléchargez le dernier fichier `.streamDeckPlugin` sur la [page des Releases](https://github.com/BKNadir/streamboard/releases).
2. Double-cliquez dessus. Stream Deck installe le plugin (ou le met à jour s'il est déjà installé).
3. La catégorie **StreamBoard** apparaît dans la liste des actions, à droite de la fenêtre Stream Deck.

## Ajouter un son

1. Glissez l'action **Play** de la catégorie StreamBoard sur une touche.
2. Dans les réglages en dessous, choisissez le **Source Type** :
   - **Local file** : cliquez sur **…** et sélectionnez un fichier audio.
   - **URL** : collez un lien direct vers un fichier audio, par exemple `https://example.com/applaudissements.mp3`.
3. Choisissez l'**Action** (le comportement de la touche, voir ci-dessous), le **Volume** et la sortie (**Output**).
4. Appuyez sur la touche : le son est joué.

Formats pris en charge : **MP3, WAV, FLAC, OGG et AIFF**.

## Modes des touches

| Mode | Effet d'un appui |
|------|------------------|
| **Play / Stop** | Joue le son. Un nouvel appui pendant la lecture l'arrête. |
| **Play / Overlap** | Lance une nouvelle copie du son à chaque appui, par-dessus celles déjà en cours. |
| **Play / Restart** | Arrête le son s'il est en cours et le relance depuis le début. |
| **Loop / Stop** | Joue le son en boucle. Un nouvel appui l'arrête. |

Tant que le son d'une touche est en cours de lecture, la touche **s'allume** (fond coloré avec un égaliseur). Elle redevient normale à la fin du son.

## Volume

Chaque touche a son propre volume, de 0 à 100 %. Il s'applique en plus du volume de votre système.

## Sortie audio

Le réglage **Output** est **commun à toutes les touches StreamBoard** :

- Modifiez-le sur n'importe quelle touche : toutes les touches utilisent la nouvelle sortie dès l'appui suivant.
- Les nouvelles touches utilisent automatiquement la sortie déjà sélectionnée.
- **System Default** suit la sortie par défaut de votre ordinateur.

Le bouton d'actualisation à côté de la liste la met à jour, par exemple après avoir branché un casque. Si la sortie choisie n'est plus disponible, les sons sont joués sur la sortie par défaut.

> Astuce : pour envoyer les sons sur votre stream sans les entendre en double, choisissez une sortie audio virtuelle (par exemple un câble virtuel ou les canaux Elgato Wave Link).

## Arrêter tous les sons

Glissez l'action **Stop** sur une touche. Un appui arrête tous les sons joués par StreamBoard, sur toutes les touches.

## Sons depuis une URL

- Le fichier est téléchargé **une seule fois** et gardé dans un cache local. Le téléchargement commence dès que vous collez l'URL : le premier appui joue le son immédiatement.
- Le lien doit pointer directement vers un fichier audio (pas vers une page web contenant un lecteur).
- Limites : 50 Mo par fichier, 30 secondes pour le téléchargement.
- Dossier du cache : `%TEMP%\streamboard` sous Windows, `$TMPDIR/streamboard` sous macOS. Les fichiers inutilisés depuis 30 jours sont supprimés automatiquement.

## Dépannage

Un **triangle d'avertissement** sur la touche signifie que le son n'a pas pu être joué. Causes fréquentes :

| Cause | Solution |
|-------|----------|
| Aucun fichier ni URL défini | Ouvrez les réglages de la touche et choisissez une source. |
| Le fichier a été déplacé ou supprimé | Sélectionnez à nouveau le fichier. |
| L'URL ne peut pas être téléchargée | Vérifiez le lien dans un navigateur : il doit télécharger directement un fichier audio. |
| Format non pris en charge | Convertissez le fichier en MP3 ou WAV (par exemple avec [Audacity](https://www.audacityteam.org/)). |
| Aucune sortie audio disponible | Vérifiez qu'un périphérique audio est branché et activé. |

**Logs** (utiles pour signaler un problème) :

- Windows : `%APPDATA%\Elgato\StreamDeck\Plugins\com.bknadir.streamboard.sdPlugin\logs`
- macOS : `~/Library/Application Support/com.elgato.StreamDeck/Plugins/com.bknadir.streamboard.sdPlugin/logs`

Signalez les problèmes sur la [page des Issues](https://github.com/BKNadir/streamboard/issues), avec les logs en pièce jointe.

## Compiler depuis les sources

Il vous faut [Node.js](https://nodejs.org/) 24 ou plus récent.

```bash
git clone https://github.com/BKNadir/streamboard.git
cd streamboard
npm install
npm run build
npx streamdeck link com.bknadir.streamboard.sdPlugin
```

- `npm run watch` recompile et redémarre le plugin à chaque modification.
- `npm run typecheck` vérifie le code sans compiler.
- Chaque push sur GitHub compile automatiquement le plugin : le fichier `.streamDeckPlugin` prêt à installer est disponible dans la section **Artifacts** de l'exécution correspondante, dans l'onglet **Actions**.
