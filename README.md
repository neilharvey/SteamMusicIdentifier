# Stream Music Identifier

A Chrome extension for identifying music playing in browser-based streams, such as Twitch, YouTube and other websites.

The extension captures audio from the active browser tab, processes it into audio chunks and sends it directly to [AudD](https://audd.io/) for music identification. It supports both single-shot identification and continuous monitoring, similar to Shazam's Auto mode.

## Development

### Prerequisites

* Node.js
* npm
* Google Chrome or another compatible Chromium-based browser
* An [AudD Music Recognition](https://docs.audd.io/) API key

### Install dependencies

From the `extension` directory:

```bash
npm install
```

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

### Set API key

Before the extension can be used, an API key must be configured.

1. Navigate to `chrome://extensions`.
2. Under the extension click **Details**
3. Within the details page click **Extension options**
4. Set your API key and click save.

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