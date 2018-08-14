# How to build native binaries

Native binaries are supported using Electron wrapper. Electron ecosystem has a quite confusing technology stack. 
We use [electron-builder](https://github.com/electron-userland/electron-builder/) to create native binaries on top of our web wallet.

## Platform

We use code signing to prevent malware injections and verify publisher prior to installation. Due to peculiarities of signing Mac OS applications, build of desktop apps for all platforms HAVE TO BE DONE under **Mac OS**.

## Environment

To start with, you have to be able to build waves wallet on your machine. Have a look at [readme](README.md) to setup build environment.

To make prerequisites installation easier it makes sense to set up [Homebrew](https://brew.sh/).
To be able to build platform-specific binaries, do the following.

### Windows
Install [wine](https://www.davidbaumgold.com/tutorials/wine-mac/)

### Linux
Install dpkg to be able to build .deb packages
```
brew install dpkg
```

## Certificates

For signing Windows application you need to have Code Signing Certificate. 
The certificate should be in .p12 or .pfx format and be password protected. 

For signing Mac OS application installer (.dmg) you need a Developer ID Application certificate from Apple. This certificate should be exported to either .p12 or .pfx format and be password protected.

WARNING! **NEVER** put certificates in the repository. To avoid accidental adding of certificates it usually make sense to keep the outside of the project directory.

## Build script

There is a build script template in the repository. Copy this file to create a build-hative.sh script which you'll run to build native apps.

Edit `build-native.sh` to set up paths to certificates and passwords to access them. 
Use `CSC_LINK` to configure path to Apple Developer ID certificate and `CSC_KEY_PASSWORD` to set password for it.
Use `WIN_CSC_LINK` to configure path to Windows Code Signing certificate and `WIN_CSC_KEY_PASSWORD` to set password for it.

Keep in mind that shell scripts require escaping of some characters like spaces and apostrophes.

Make the script runnable by command:
```
chmod u+x build-native.sh
```

By default shell scripts and certificates are ignored by git to prevent sensitive data leakage.

Build script assembles native applications for testnet and mainnet. You can find native binaries in `distr/native` directory.
