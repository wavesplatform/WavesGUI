import { Storage } from './Storage';
import { shell, webFrame } from 'electron';

process.once('loaded', () => {
    (global as any).WebStorage = new Storage();
    (global as any).openInBrowser = function (url) {
        shell.openExternal(url);
    };
});
