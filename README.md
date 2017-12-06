# Client

![Alt text](https://pbs.twimg.com/media/CjUjPVgVAAA60Pv.jpg "Waves Lite Client Screen")

Ever wanted to access your crypto funds quickly but had to wait for hours while the blockchain downloads first?
The Waves Lite Client connects to public Waves nodes to retrieve up-to-date blockchain information.

We provide all the cryptographic tools required to create addresses, sign and verify transactions for the Waves blockchain.
The Lite Client reads all the data from the public nodes, creates the transaction directly in the browser,
and simply broadcasts it in a finished state.

# Security

During registration, the most important piece of information is the wallet SEED. Save it somewhere safe:
write it down on a piece of paper, or store it in different media.


Using the SEED you can always import your account again or change your password. The SEED will be AES-encrypted
with a password of your choice, which you can enter to access your account at the log-in screen.
Every transaction will be signed locally with JavaScript and transmitted to the node without revealing your wallet seed or private keys.

# Testnet and Mainnet

The Client sources are currently setup for testnet.
If you want to run on mainnet please change the according settings in js/app.js. Check for the possible values Gruntfile.js.

# How to use the codebase

Our project uses a javascript development environment that needs to be set up before you try to open src/index.html in your browser.

## Prerequisites

1. You need to install npm. Binaries and installation instructions could be found [here](https://nodejs.org/en/download/)
2. You need to install bower. [Here](https://bower.io/) is a good link to start with.

## Environment set up

Since you have your environment set up you can clone the repository and run in the project root directory
```
npm install
```
Since we are reorganizing the building process, there is something more you need to have a fully working Waves Client:
```
npm install -g grunt
npm install grunt
grunt distr
```
Those commands will prepare all required dependencies. Now feel free to open src/index.html in your browser.

# Packages description

## Downloadable distributions

Here in the [Releases page](https://github.com/wavesplatform/WavesGUI/releases) you can find all Lite Client packages available for download.
For mainnet Client please download *waves-lite-client-mainnet-vx.y.z.zip*.
For testnet use *waves-lite-client-testnet-vx.y.z.zip*.

To run the Lite Client downloaded as a regular zip archive, follow these steps:
1. Download and extract zip package to some directory
2. Navigate to that directory
3. Open index.html in your browser
4. Start using Lite Client!

Please keep in mind that the Lite Client uses your browser’s local storage to persist your accounts’ data in a secure way.
The browser’s local storage is bound to the url of the page, so in this case it will be the path to index.html.
This means that if you download the next Lite Client version, please ensure you unpack the archive in the previous version’s directory.
Otherwise, the path to the index.html will change and you won’t be able to see your stored accounts.

## Chrome plugin

Our Client has also a standalone version available in the [Chrome Web Store](https://chrome.google.com/webstore/detail/wavesliteapp/kfmcaklajknfekomaflnhkjjkcjabogm).
This is an application for the Chrome web browser and it is available for mainnet only.
The Chrome plugin has one major benefit: all accounts registered on one device are automatically available on your other devices on which the Waves Lite Client extension is installed.
This feature requires being authorized in Chrome.

## Online wallets

We provide online-hosted versions of wallets for [testnet](https://testnet.waveswallet.io) and [mainnet](https://waveswallet.io).
We do not recommend using online versions of the wallets for mainnet due to security reasons.
The safest way is to use the Chrome plugin or binaries deployed on Github, because we can work with their administrators to address potential scams.

# FAQ
## Can I generate account being completely offline?

Yes, you can! The current Lite Client version tries to access the required node only when you log in to your account.
All you need to do is to download the Lite Client and run it in a safe environment (i.e. on a machine without access to the internet).

## Can I make the Lite Client use my own node instead of the default one?

Yes, but you will have to modify some javascript code. Follow these simple steps:
1. Open the js/waves-lite-client-mainnet-vx.y.z.js in your favourite text editor
2. Search for the string AngularApplicationConfig
3. Find where the NODE_ADDRESS is set
4. Change the address to the address of your node. (Something like http://127.0.0.1:6869 or http://localhost:6869)

Yes, we're gonna make this much easier in the future versions...
