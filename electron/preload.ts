import { Storage } from './Storage';
import { shell, remote } from 'electron';


process.once('loaded', () => {
    (global as any).WebStorage = new Storage();
    (global as any).openInBrowser = function (url) {
        shell.openExternal(url);
    };
    (global as any).transfer = remote.require('./transfer').transfer;
});
