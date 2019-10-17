const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;  
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  return await notarize({
    appBundleId: 'com.wavesplatform.client',
    appPath: 'release/mainnet/Waves DEX[mainnet]-1.4.5-mac.dmg',
    appleId: '${appleIdUsername}',
    appleIdPassword: '${appleIdPassword}',
  });
};