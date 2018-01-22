import { app, BrowserWindow, screen, protocol } from 'electron';
import { IMetaJSON, ISize } from './package';
import { format } from 'url';
import { readFile, writeFile, writeFileSync } from 'fs';
import { join } from 'path';

import BrowserWindowConstructorOptions = Electron.BrowserWindowConstructorOptions;

const CONFIG = {
    META_PATH: join(__dirname, 'meta.json'),
    INDEX_PATH: './index.html'
};


class Main {

    private mainWindow: BrowserWindow;

    constructor() {
        this.mainWindow = null;

        this.setHandlers();
    }

    private createWindow() {
        Main.loadMeta().then((pack: IMetaJSON) => {
            this.mainWindow = new BrowserWindow(Main.getWindowOptions(pack));
            this.mainWindow.loadURL(format({
                pathname: CONFIG.INDEX_PATH,
                protocol: 'file:',
                slashes: true
            }));

            this.mainWindow.on('closed', () => {
                this.mainWindow = null;
            });

            const onChangeWindow = Main.asyncHandler(() => {
                const [x, y] = this.mainWindow.getPosition();
                const [width, height] = this.mainWindow.getSize();
                const isFullScreen = this.mainWindow.isFullScreen();

                Main.updateMeta({ x, y, width, height, isFullScreen });
            }, 200);

            this.mainWindow.on('move', onChangeWindow);
            this.mainWindow.on('resize', onChangeWindow);
            this.mainWindow.on('enter-full-screen', onChangeWindow);
            this.mainWindow.on('leave-full-screen', onChangeWindow);
        });
    }

    private replaceProtocol() {
        protocol.unregisterProtocol('file');
        protocol.registerFileProtocol('file', (request, callback) => {
            const url = request.url.substr(7).replace(/(#.*)|(\?.*)/, '');
            console.log(url);
            callback(join(__dirname, url));
        }, (error) => {
            if (error) {
                console.error('Failed to register protocol');
            }
        });
    }

    private setHandlers() {
        app.on('ready', () => this.onAppReady());
        app.on('window-all-closed', Main.onAllWindowClosed);
        app.on('activate', () => this.onActivate());
    }

    private onAppReady() {
        this.replaceProtocol();
        this.createWindow();
    }

    private onActivate() {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (!this.mainWindow) {
            this.createWindow();
        }
    }

    private static onAllWindowClosed() {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
            app.quit();
        }
    }

    private static loadMeta(): Promise<IMetaJSON> {
        return new Promise((resolve, reject) => {
            readFile(CONFIG.META_PATH, 'utf8', (err, file) => {
                err ? reject(err) : resolve(JSON.parse(file));
            });
        });
    }

    private static updateMeta({ x, y, width, height, isFullScreen }) {
        return Main.loadMeta().then((meta) => {
            meta.window.lastOpen = {
                width, height, x, y, isFullScreen
            };
            writeFile(CONFIG.META_PATH, JSON.stringify(meta, null, 4), () => null);
        });
    }

    private static getWindowOptions(pack: IMetaJSON): BrowserWindowConstructorOptions {
        const fullscreen = pack.window.lastOpen && pack.window.lastOpen.isFullScreen;
        const display = screen.getPrimaryDisplay();
        let width, height, x, y;

        if (pack.window.lastOpen) {
            width = pack.window.lastOpen.width;
            height = pack.window.lastOpen.height;
            x = pack.window.lastOpen.x;
            y = pack.window.lastOpen.y;
        } else {
            const size = Main.getStartSize({
                width: display.workAreaSize.width,
                height: display.size.height
            }, pack);

            width = size.width;
            height = size.height;
            x = (display.size.width - width) / 2;
            y = (display.size.height - height) / 2;
        }

        return {
            minWidth: pack.window.minSize.width,
            minHeight: pack.window.minSize.height,
            icon: join(__dirname, 'img/icon.png'),
            fullscreen, width, height, x, y
        };
    }

    private static getStartSize(size: ISize, pack: IMetaJSON): ISize {
        const width = Math.max(Math.min(size.width, pack.window.open.maxSize.width), pack.window.open.minSize.width);
        const height = Math.max(Math.min(size.height, pack.window.open.maxSize.height), pack.window.open.minSize.height);

        return { width, height };
    }

    private static asyncHandler(handler, timeout) {
        let timer = null;
        return function () {
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(() => {
                timer = null;
                handler();
            }, timeout);
        };
    }

}

new Main();
