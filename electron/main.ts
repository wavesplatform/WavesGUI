import { app, BrowserWindow, screen, protocol } from 'electron';
import { ISize, IMetaJSON } from './package';
import { format } from 'url';
import { readFile, stat, writeFile } from 'fs';
import { join } from 'path';

import BrowserWindowConstructorOptions = Electron.BrowserWindowConstructorOptions;

const CONFIG = {
    META_PATH: join(app.getPath('userData'), 'meta.json'),
    INDEX_PATH: './index.html',
    MIN_SIZE: {
        width: 400,
        height: 500
    },
    FIRST_OPEN_SIZES: {
        MIN_SIZE: {
            width: 1024,
            height: 768
        },
        MAX_SIZE: {
            width: 1440,
            height: 960
        }
    }
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

                return Main.updateMeta({ x, y, width, height, isFullScreen });
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
        return Main.readJSON(CONFIG.META_PATH) as Promise<IMetaJSON>;
    }

    private static updateMeta({ x, y, width, height, isFullScreen }) {
        return Main.loadMeta().then((meta) => {
            meta.lastOpen = {
                width, height, x, y, isFullScreen
            };
            return Main.writeJSON(CONFIG.META_PATH, meta);
        });
    }

    private static getWindowOptions(meta: IMetaJSON): BrowserWindowConstructorOptions {
        const fullscreen = meta.lastOpen && meta.lastOpen.isFullScreen;
        const display = screen.getPrimaryDisplay();
        let width, height, x, y;

        if (meta.lastOpen) {
            width = meta.lastOpen.width;
            height = meta.lastOpen.height;
            x = meta.lastOpen.x;
            y = meta.lastOpen.y;
        } else {
            const size = Main.getStartSize({ width: display.workAreaSize.width, height: display.size.height });

            width = size.width;
            height = size.height;
            x = (display.size.width - width) / 2;
            y = (display.size.height - height) / 2;
        }

        return {
            minWidth: CONFIG.MIN_SIZE.width,
            minHeight: CONFIG.MIN_SIZE.height,
            icon: join(__dirname, 'img/icon.png'),
            fullscreen, width, height, x, y
        };
    }

    private static getStartSize(size: ISize): ISize {
        const width = Math.max(
            Math.min(size.width, CONFIG.FIRST_OPEN_SIZES.MAX_SIZE.width),
            CONFIG.FIRST_OPEN_SIZES.MIN_SIZE.width
        );
        const height = Math.max(
            Math.min(size.height, CONFIG.FIRST_OPEN_SIZES.MAX_SIZE.height),
            CONFIG.FIRST_OPEN_SIZES.MIN_SIZE.height
        );

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

    private static exists(path): Promise<void> {
        return new Promise((resolve, reject) => {
            stat(path, (err, stat) => {
                if (err) {
                    reject();
                } else {
                    resolve();
                }
            });
        });
    }

    private static readJSON(path): Promise<object> {
        return Main.readFile(path)
            .then((data) => JSON.parse(data))
            .catch(() => Object.create(null));
    }

    private static readFile(path): Promise<string> {
        return Main.exists(path).then(() => {
            return new Promise((resolve, reject) => {
                readFile(path, 'utf8', (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            }) as Promise<string>;
        });
    }

    private static writeFile(path: string, content: string): Promise<void> {
        return new Promise((resolve, reject) => {
            writeFile(path, content, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    private static writeJSON(path: string, data: object): Promise<void> {
        return Main.writeFile(path, JSON.stringify(data, null, 4));
    }
}

new Main();
