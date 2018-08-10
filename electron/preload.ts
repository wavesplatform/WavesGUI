import { Storage } from './Storage';
import { shell, remote } from 'electron';

process.once('loaded', () => {
    const g: any = global;
    g.WebStorage = new Storage();
    g.openInBrowser = function (url) {
        shell.openExternal(url);
    };

    g.TransportNodeHid = require('@ledgerhq/hw-transport-node-hid');

    const transferModule = remote.require('./transfer');

    g.transfer = transferModule.transfer;
    g.listenMainProcessEvent = transferModule.listenMainProcessEvent;
    g.stopListenMainProcessEvent = transferModule.stopListenMainProcessEvent;
    g.runMainProcessEvent = transferModule.runMainProcessEvent;
});
