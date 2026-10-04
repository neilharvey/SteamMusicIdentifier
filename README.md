# Stream Music Identifier

A Chrome extension for identifying music playing in browser-based streams, such as Twitch, YouTube and other websites.

The extension captures audio from the active browser tab, processes it into audio chunks and sends it directly to [AudD](https://audd.io/) for music identification. It supports both single-shot identification and continuous monitoring, similar to Shazam's Auto mode.

## Features

* **Browser audio capture** using the Chrome `tabCapture` API.
* **Audio processing** using the Web Audio API and AudioWorklet.
* **Chunked audio capture** with five-second mono PCM audio chunks.
* **WAV encoding** to convert audio chunks into 16-bit PCM WAV format for identification.
* **Single identification** (`once`) to identify the music currently playing.
* **Continuous identification** (`continuous`) to periodically identify music while capture remains active.
* **Direct AudD integration** for music identification without an intermediary backend.
* **Provider abstraction** through `MusicIdentificationService`, allowing additional identification providers to be integrated in the future.
* **Chrome Manifest V3** architecture using a service worker and offscreen document.

## Development

### Prerequisites

* Node.js
* npm
* Google Chrome or another compatible Chromium-based browser

### Install dependencies

From the `extension` directory:

```bash
npm install
```

### Available npm commands

| Command             | Description                                    |
| ------------------- | ---------------------------------------------- |
| `npm install`       | Install project dependencies                   |
| `npm run build`     | Type-check and create a production build       |
| `npm run watch`     | Rebuild automatically when source files change |
| `npm run typecheck` | Run TypeScript type checking                   |
| `npm run clean`     | Remove the production build directory          |

### Build the extension

From the `extension` directory:

```bash
npm run build
```

The production build is generated in the `dist` directory.

### Load the extension in Chrome

1. Build the extension using `npm run build`.
2. Navigate to `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Select the `extension/dist` directory.

The extension will then be available in the Chrome toolbar.

After making changes, rebuild the extension and select **Reload** on the extension's card in Chrome.

For active development, `npm run watch` can be used to rebuild automatically. The extension must still be reloaded in Chrome to apply changes.

## Third-party Services and API Usage

### AudD

The extension uses the [AudD Music Recognition API](https://docs.audd.io/) to identify music from captured audio.

Audio is captured from the active browser tab, processed into audio chunks and sent directly from the extension to AudD for recognition.

AudD may return information including:

* Track title
* Artist
* Album
* Release date
* Song links

The availability of these fields depends on the recognition result.

### API credentials

AudD requires an API token to authenticate requests. The token must be configured for the extension to communicate with the service.

Use of AudD is subject to its API terms, rate limits, pricing and licensing conditions. Refer to the [AudD documentation](https://docs.audd.io/) for further details.

## Licence

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

Third-party libraries, services and APIs remain subject to their respective licences and terms of use.
