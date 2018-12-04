import { Storage } from './Storage';
import { shell, remote } from 'electron';

process.once('loaded', () => {
    const g: any = global;
    g.WebStorage = new Storage();
    g.openInBrowser = function (url) {
        shell.openExternal(url);
    };
    g.isDesktop = true;
    try {
        g.TransportNodeHid = require('@ledgerhq/hw-transport-node-hid');
    } catch (e) {
        
    }

    const transferModule = remote.require('./transfer');

    g.transfer = transferModule.transfer;
});
