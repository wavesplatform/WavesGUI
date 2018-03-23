import { app, BrowserWindow, Menu, MenuItem } from 'electron';
import { IHash } from '../ts-scripts/interface';

export class Bridge {

    private main: { mainWindow: BrowserWindow; menu: Menu };
    private bridgeCommands: IHash<(data?: object) => any | Promise<any>>;


    constructor(main: { mainWindow: BrowserWindow; menu: Menu }) {
        this.main = main;

        this.bridgeCommands = {
            'addDevToolsMenu': this.addDevToolsMenu,
            'reload': this.reload,
            'getLocale': this.getLocale
        };
    }

    public transfer(command: string, data: object): Promise<any> {
        if (command in this.bridgeCommands) {
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
            return Promise.reject(new Error('Wring command!'));
        }
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
