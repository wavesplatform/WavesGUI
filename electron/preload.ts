import { Storage } from './Storage';
import { shell, remote } from 'electron';


process.once('loaded', () => {
    const g: any = global;
    g.WebStorage = new Storage();
    g.openInBrowser = function (url) {
        shell.openExternal(url);
    };
    const transferModule = remote.require('./transfer');

    g.transfer = transferModule.transfer;
});
