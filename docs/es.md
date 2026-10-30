# StreamBoard – Guía de uso

🌐 [English](en.md) · [Français](fr.md) · **Español** · [Italiano](it.md) · [Deutsch](de.md) · [Nederlands](nl.md)

StreamBoard convierte tu Stream Deck en una botonera de sonidos. Cada tecla reproduce un sonido desde un archivo de tu ordenador o desde una dirección web (URL), en la salida de audio que elijas.

## Requisitos

- Windows 10 o posterior, o macOS 12 o posterior
- Software Stream Deck 7.1 o posterior

No hace falta instalar nada más: el motor de audio va incluido en el plugin.

## Instalación

1. Descarga el último archivo `.streamDeckPlugin` desde la [página de Releases](https://github.com/BKNadir/streamboard/releases).
2. Haz doble clic en él. Stream Deck instala el plugin (o lo actualiza si ya está instalado).
3. La categoría **StreamBoard** aparece en la lista de acciones, a la derecha de la ventana de Stream Deck.

## Añadir un sonido

1. Arrastra la acción **Play** de la categoría StreamBoard a una tecla.
2. En los ajustes de abajo, elige el **Source Type**:
   - **Local file**: haz clic en **…** y selecciona un archivo de audio.
   - **URL**: pega un enlace directo a un archivo de audio, por ejemplo `https://example.com/aplausos.mp3`.
3. Elige la **Action** (el comportamiento de la tecla, ver abajo), el **Volume** y la salida (**Output**).
4. Pulsa la tecla: el sonido se reproduce.

Formatos compatibles: **MP3, WAV, FLAC, OGG y AIFF**.

## Modos de las teclas

| Modo | Qué hace una pulsación |
|------|------------------------|
| **Play / Stop** | Reproduce el sonido. Si vuelves a pulsar mientras suena, se detiene. |
| **Play / Overlap** | Inicia una nueva copia del sonido en cada pulsación, encima de las que ya suenan. |
| **Play / Restart** | Detiene el sonido si está sonando y lo vuelve a iniciar desde el principio. |
| **Loop / Stop** | Reproduce el sonido en bucle. Si vuelves a pulsar, se detiene. |

## Volumen

Cada tecla tiene su propio volumen, de 0 a 100 %. Se aplica además del volumen del sistema.

## Salida de audio

El ajuste **Output** es **común a todas las teclas de StreamBoard**:

- Cámbialo en cualquier tecla y todas las teclas usarán la nueva salida a partir de la siguiente pulsación.
- Las teclas nuevas usan automáticamente la salida ya seleccionada.
- **System Default** sigue la salida predeterminada de tu ordenador.

El botón de actualizar junto a la lista la vuelve a cargar, por ejemplo después de conectar unos auriculares. Si la salida elegida ya no está disponible, los sonidos se reproducen en la salida predeterminada.

> Consejo: para enviar los sonidos a tu directo sin oírlos dos veces, elige una salida de audio virtual (por ejemplo un cable virtual o los canales de Elgato Wave Link).

## Detener todos los sonidos

Arrastra la acción **Stop** a una tecla. Al pulsarla se detienen todos los sonidos que reproduce StreamBoard, en todas las teclas.

## Sonidos desde una URL

- El archivo se descarga **una sola vez** y se guarda en una caché local. La descarga empieza en cuanto pegas la URL, así que la primera pulsación suena al instante.
- El enlace debe apuntar directamente a un archivo de audio (no a una página web con un reproductor).
- Límites: 50 MB por archivo, 30 segundos para la descarga.
- Carpeta de la caché: `%TEMP%\streamboard` en Windows, `$TMPDIR/streamboard` en macOS. Los archivos que no se usan desde hace 30 días se borran automáticamente.

## Solución de problemas

Un **triángulo de advertencia** en la tecla significa que el sonido no se ha podido reproducir. Causas habituales:

| Causa | Solución |
|-------|----------|
| No hay archivo ni URL | Abre los ajustes de la tecla y elige una fuente. |
| El archivo se ha movido o borrado | Vuelve a seleccionar el archivo. |
| La URL no se puede descargar | Comprueba el enlace en un navegador: debe descargar directamente un archivo de audio. |
| Formato no compatible | Convierte el archivo a MP3 o WAV (por ejemplo con [Audacity](https://www.audacityteam.org/)). |
| No hay ninguna salida de audio | Comprueba que haya un dispositivo de audio conectado y activado. |

**Registros (logs)** (útiles para informar de un problema):

- Windows: `%APPDATA%\Elgato\StreamDeck\Plugins\com.bknadir.streamboard.sdPlugin\logs`
- macOS: `~/Library/Application Support/com.elgato.StreamDeck/Plugins/com.bknadir.streamboard.sdPlugin/logs`

Informa de los problemas en la [página de Issues](https://github.com/BKNadir/streamboard/issues), adjuntando los registros.

## Compilar desde el código fuente

Necesitas [Node.js](https://nodejs.org/) 24 o posterior.

```bash
git clone https://github.com/BKNadir/streamboard.git
cd streamboard
npm install
npm run build
npx streamdeck link com.bknadir.streamboard.sdPlugin
```

- `npm run watch` recompila y reinicia el plugin con cada cambio.
- `npm run typecheck` comprueba el código sin compilar.
- Cada push en GitHub compila el plugin automáticamente: el archivo `.streamDeckPlugin` listo para instalar está en la sección **Artifacts** de la ejecución correspondiente, en la pestaña **Actions**.
