"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
class Bridge {
    constructor(main) {
        this.main = main;
        this.bridgeCommands = {
            'addDevToolsMenu': this.addDevToolsMenu,
            'reload': this.reload,
            'getLocale': this.getLocale
        };
    }
    getProtocolHandler() {
        return (request, callback) => {
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
                    }
                    else {
                        callback(JSON.stringify({ status: 'success', data: result || {} }));
                    }
                }
                catch (e) {
                    callback(JSON.stringify({ status: 'error', message: e.message }));
                }
            }
            else {
                callback(JSON.stringify({ status: 'error', message: 'Wrong url!' }));
            }
        };
    }
    getLocale() {
        return electron_1.app.getLocale() || 'en';
    }
    addDevToolsMenu() {
        const item = new electron_1.MenuItem({
            label: 'God Mode',
            submenu: [{
                    role: 'toggledevtools'
                }]
        });
        this.main.menu.append(item);
        electron_1.Menu.setApplicationMenu(this.main.menu);
    }
    reload() {
        this.main.mainWindow.reload();
    }
}
exports.Bridge = Bridge;
//# sourceMappingURL=Bridge.js.map