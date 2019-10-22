import { Storage } from './Storage';
import { shell, remote } from 'electron';
import { SimpleConnect } from './SimpleConnect';

process.once('loaded', () => {
    const g: any = global;
    g.WebStorage = new Storage();
    g.openInBrowser = function (url) {
        shell.openExternal(url);
    };
    g.isDesktop = true;
    g.SimpleConnect = SimpleConnect;

    try {
        g.TransportNodeHid = require('@ledgerhq/hw-transport-node-hid');
    } catch (e) {

    }

    const transferModule = remote.require('./transfer');

    g.transfer = transferModule.transfer;
});
