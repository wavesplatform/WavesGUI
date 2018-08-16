# Waves Client (beta version)

The new client is available here and at [beta.wavesplatform.com](https://beta.wavesplatform.com/).

The old stable client is available at [waveswallet.io](https://waveswallet.io/) and on branch [old-client](https://github.com/wavesplatform/WavesGUI/tree/old-client).

## Setup

You will need Node.js 8.9.4 (or higher) and npm v5 (or higher).

```
npm i
npm run server
```

The server will be launched locally, ports for different versions will be shown in the console.

* `dev` version is without concatenation and minification of files
* `normal` version has files concatenated into one
* `min` version is the production one, with files both concatenated and minified
