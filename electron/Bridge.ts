///<reference path="interface.d.ts"/>


import { app, BrowserWindow, Menu, MenuItem, dialog } from 'electron';
import { IHash } from '../ts-scripts/interface';
import { join } from 'path';
import { write } from './utils';

export class Bridge implements IBridge {

    private main: IMain;
    private bridgeCommands: IHash<(data?: any) => any | Promise<any>>;


    constructor(main: IMain) {
        this.main = main;

        this.bridgeCommands = {
            'addDevToolsMenu': this.addDevToolsMenu,
            'reload': this.reload,
            'getLocale': this.getLocale,
            'download': this.download,
            'setLanguage': this.setLanguage
        };
    }

    public transfer(command: string, data: object): Promise<any> {
        if (this.bridgeCommands.hasOwnProperty(command)) {
            try {
                const result = this.bridgeCommands[command].call(this, data);
                if (result && result.then) {
                    return result;
                } else {
                    return Promise.resolve(result);
                }
            } catch (e) {
                return Promise.reject(e);
            }
        } else {
            return Promise.reject(new Error(`Wrong command! "${command}"`));
        }
    }

    private setLanguage(lng: string): void {
        this.main.setLanguage(lng);
    }

    private download(data: IDownloadData): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const path = app.getPath('downloads');
            const options = { defaultPath: join(path, data.fileName) };

            dialog.showSaveDialog(this.main.mainWindow, options, function (filename) {
                if (filename) {
                    return write(filename, data.fileContent).then(resolve, reject);
                } else {
                    return reject(new Error('Cancel'));
                }
            });
        });
    }

    private getLocale(): string {
        return app.getLocale() || 'en';
    }

    private addDevToolsMenu() {
        this.main.addDevTools();
    }

    private reload() {
        this.main.reload();
    }
}

export interface IDownloadData {
    fileContent: string;
    fileName: string;
}
