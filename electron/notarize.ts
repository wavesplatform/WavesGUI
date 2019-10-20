const notarize = require ('electron-notarize').notarize;
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const access = fs.createWriteStream('./out.log');
process.stdout.write = process.stderr.write = access.write.bind(access);

process.on('uncaughtException', function(err) {
           console.error((err && err.stack) ? err.stack : err);
});

async function notarizeAppInfo() {
  const { stdout, stderr } = await exec("\
    { sleep 30 && xcrun altool --notarization-history 0 -u '${appleIdUsername}' -p '${appleIdPassword}' || true ;} && \
    { xcrun altool --notarization-info \$(cat out.log | grep 'checking notarization status' | cut -d':' -f2 | cut -d' ' -f2 | \
        tail -1) -u '${appleIdUsername}' -p '${appleIdPassword}' || true ;} && \
    { xcrun stapler staple -v './release/mainnet/mac/Waves DEX.app' || true ;}");
    console.log(`\${stdout}`);
    if (stderr) {
        console.error("error: \${stderr}");
    }
}

async function notarizeApp () {
    try {
        await notarize({
            appBundleId: 'com.wavesplatform.client',
            appPath: 'release/mainnet/mac/Waves DEX.app',
            appleId: '${appleIdUsername}',
            appleIdPassword: '${appleIdPassword}'
       });
    }
    catch(err){
         console.log(err);
        return true;
    }
}

module.exports = async function sequence(context) {
    const {electronPlatformName} = context;
    if (electronPlatformName === 'darwin') {
        await notarizeApp();
        await notarizeAppInfo();
    }
};
