# Client

![Alt text](https://pbs.twimg.com/media/CjUjPVgVAAA60Pv.jpg "Waves Client Screen")

Ever wanted to access your blockchain funds quickly but had to wait for hours while the blockchain downloads before doing so? 
The Waves Lite Client connects to public Waves nodes in order to retrieve up-to-date blockchain information.

We provide all the cryptography tools to create addresses, sign and verify transactions for the Waves blockchain. The Lite Client reads all the data from the public nodes, writes the transaction directly in the browser, and simply broadcasts it in a finished state.

# Security

During registration, the most important information is the wallet SEED. Save it somewhere safe, write it down on a piece of paper, or store it in different media.

With the SEED you can always import your account again or change the password.

This SEED will be AES-encrypted with a password of your choice and you can unlock it to access your account at the log-in screen.
Every transaction will be signed locally with JavaScript and transmitted to the node without revealing your wallet seed or private keys.

# Testnet and Mainnet

The Client sources are currently setup for testnet. If you want to run on mainnet please change the according settings in js/app.js 
Check out for the possible values Gruntfile.js.

# How to use the codebase

Our project uses javascript development environment that needs to be set up before you try to open src/index.html in your browser.

## Prerequisites

1. You need to install npm. Binaries and installation instructions could be found [here](https://nodejs.org/en/download/)
1. You need to install bower. [Here](https://bower.io/) is a good link to start with.

## Environment set up

Since you have your enviroment set up you can clone the repository and run
```
npm install
```
This command will prepare all required dependencies. Now feel free to open src/index.html in your browser.

# Packages description

## Downloadable distributions

Here in the Releases page you can see all Lite Client packages available for download. For mainnet Client please download *waves-lite-client-testnet-vx.y.z.zip*. 
For testnet use *waves-lite-client-mainnet-vx.y.z.zip*. 

To run Lite Client downloaded as a usual zip archive follow these steps:
1. Download and extract zip package to some directory
1. Navigate to that directory
1. Open index.html in your browser
1. Start using Lite Client!

Please keep in mind that Lite Client uses browser local storage to persist your accounts' data in a secure way. 
Browser local storage is bound to the url of the page so in your case it will be the path to your index.html. 
It means that if you'll download the next Lite Client version please make sure you unpack the archive in the previous version's directory. 
Otherwise, the path to the index.html will change and you won't be able to see your stored accounts.

## Chrome plugin

Our Client has also a version available in [Chrome Web Store](https://chrome.google.com/webstore/detail/wavesliteapp/kfmcaklajknfekomaflnhkjjkcjabogm). 
This is an application for Chrome web browser and it's available for mainnet only. 
Chrome plugin has one major benefit: all accounts registered on one device are automatically available on other your devices where the Waves Lite Client extension is installed. 
This feature requires being authorized in Chrome.

## Online wallets

We provide online-hosted versions of wallets for [testnet](testnet.waveswallet.io) and [mainnet](waveswallet.io). 
We do not recommend using online versions of the wallets for mainnet due to security reasons. 
The safest way is to use Chrome plugin or binaries deployed in Github, because we can cooperate with resource's administration to fight with scam.

# FAQ
## Can I generate account being completely offline?

Yes, you can! Current Lite Client version tries to access the node only when you log in to your account.
All you need to do is to download the Lite Client and run it in a safe environment (e.g. on a machine without access to the internet)

## Can I make the Lite Client use my own node instead of the default one?

Sure. But you have to modify some javascript code. Follow these simple steps:
1. Open the js/waves-lite-client-mainnet-vx.y.z.js in your favourite text editor
1. Search for the string AngularApplicationConfig
1. Find where the NODE_ADDRESS is set
1. Change the address to the address of your node. (Something like http://127.0.0.1:6869 or http://localhost:6869)

Yes, we're gonna make this much easier in the future versions.