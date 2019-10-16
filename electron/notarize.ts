const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;  
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  return await notarize({
    appBundleId: 'com.wavesplatform.client',
    appPath: 'out/mainnet/mac/Waves DEX.app',
    appleId: '',
    appleIdPassword: '',
  });
};