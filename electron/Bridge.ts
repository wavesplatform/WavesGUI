import { app, BrowserWindow, Menu, MenuItem } from 'electron';
import { IHash } from '../ts-scripts/interface';
import RegisterStringProtocolRequest = Electron.RegisterStringProtocolRequest;

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

    public getProtocolHandler() {
        return (request: RegisterStringProtocolRequest, callback: (data?: string) => void) => {

            const url = request.url.replace('cmd:', '');
            const [command, dataString] = url.split('/');

            if (command in this.bridgeCommands) {
                try {
                    const result = this.bridgeCommands[command].call(this, JSON.parse(dataString));
                    if (result && result instanceof Promise) {
                        result.then((data) => {
                            callback(JSON.stringify({ status: 'success', data: data || {} }));
                        }, (error) => {
                            callback(JSON.stringify({ status: 'error', message: error.message }));
                        });
                    } else {
                        callback(JSON.stringify({ status: 'success', data: result || {} }));
                    }
                } catch (e) {
                    callback(JSON.stringify({ status: 'error', message: e.message }));
                }
            } else {
                callback(JSON.stringify({ status: 'error', message: 'Wrong url!' }));
            }
        };
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
