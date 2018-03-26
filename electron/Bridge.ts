import { app, BrowserWindow, Menu, MenuItem, dialog } from 'electron';
import { IHash } from '../ts-scripts/interface';
import { join } from 'path';
import { writeFile } from './utils';

export class Bridge {

    private main: { mainWindow: BrowserWindow; menu: Menu };
    private bridgeCommands: IHash<(data?: object) => any | Promise<any>>;


    constructor(main: { mainWindow: BrowserWindow; menu: Menu }) {
        this.main = main;

        this.bridgeCommands = {
            'addDevToolsMenu': this.addDevToolsMenu,
            'reload': this.reload,
            'getLocale': this.getLocale,
            'download': this.download
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
            return Promise.reject(new Error('Wrong command!'));
        }
    }

    private download(data: IDownloadData): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const path = app.getPath('downloads');
            const options = { defaultPath: join(path, data.fileName) };

            dialog.showSaveDialog(this.main.mainWindow, options, function (filename) {
                if (filename) {
                    return writeFile(filename, data.fileContent).then(resolve, reject);
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
        const item = new MenuItem({
            label: 'God Mode',
            submenu: [{
                role: 'toggledevtools'
            }]
        });
        this.main.menu.append(item);
        Menu.setApplicationMenu(this.main.menu);
    }

    private reload() {
        this.main.mainWindow.reload();
    }
}

export interface IDownloadData {
    fileContent: string;
    fileName: string;
}
