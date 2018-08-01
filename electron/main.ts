import { app, BrowserWindow, screen, Menu } from 'electron';
import { Bridge } from './Bridge';
import { ISize, IMetaJSON } from './package';
import { format } from 'url';
import { join } from 'path';
import { read, readJSON, write, writeJSON } from './utils';
import { homedir } from "os";

import BrowserWindowConstructorOptions = Electron.BrowserWindowConstructorOptions;
import MenuItemConstructorOptions = Electron.MenuItemConstructorOptions;


const CONFIG = {
    META_PATH: join(app.getPath('userData'), 'meta.json'),
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
    },
    PROTOCOL: 'waves',
    ARGV_FLAGS: {
        IGNORE_SSL_ERROR: '--ignore-ssl-error',
        NO_REPLACE_DESKTOP_FILE: '--no-replace-desktop',
        SERVER: '--server'
    }
};

const MENU_LIST: MenuItemConstructorOptions[] = [
    {
        label: 'Application',
        submenu: [
            { label: 'Quit', accelerator: 'Command+Q', click: () => app.quit() }
        ]
    } as MenuItemConstructorOptions, {
        label: 'Edit',
        submenu: [
            { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
            { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
            { type: 'separator' },
            { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
            { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
            { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
            { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
        ]
    } as MenuItemConstructorOptions
];

const argv = Array.prototype.slice.call(process.argv);

class Main {

    public mainWindow: BrowserWindow;
    public menu: Menu;
    public bridge: Bridge;
    private clientIsReady: Promise<{}>;
    private dataPromise: Promise<IMetaJSON>;
    private readonly ignoreSslError: boolean;
    private readonly noReplaceDesktopFile: boolean;
    private readonly server: string;

    constructor() {
        const canOpenElectron = this.makeSingleInstance();

        if (!canOpenElectron) {
            return null;
        }

        this.ignoreSslError = argv.includes(CONFIG.ARGV_FLAGS.IGNORE_SSL_ERROR);
        this.noReplaceDesktopFile = argv.includes(CONFIG.ARGV_FLAGS.NO_REPLACE_DESKTOP_FILE);

        this.mainWindow = null;
        this.bridge = new Bridge(this);
        this.dataPromise = Main.loadMeta();

        this.setHandlers();
    }

    public onClientReady() {

    }

    private makeSingleInstance(): boolean {
        const isOpenClient = app.makeSingleInstance((argv) => {
            const [execPath, browserLink] = argv;
            this.openProtocolIn(browserLink);
        });

        if (isOpenClient) {
            app.quit();
        }

        return !isOpenClient;
    }

    private openProtocolIn(browserLink) {
        if (!browserLink || browserLink.indexOf('waves://') !== 0) {
            return null;
        }

        const url = browserLink.replace('waves://', '');
        this.mainWindow.webContents.executeJavaScript(`runMainProcessEvent('open-from-browser', '${url}')`);
    }

    private createWindow() {
        this.dataPromise.then((meta) => {
            const pack = require('./package.json');
            this.mainWindow = new BrowserWindow(Main.getWindowOptions(meta));

            const url = argv[1] && !argv[1].includes('--') ? argv[1].replace('waves://', '') : ''
            this.mainWindow.loadURL(`https://${pack.server}/#${url}`, { 'extraHeaders': 'pragma: no-cache\n' });

            setTimeout(() => {
                argv.forEach((a) => {
                    this.mainWindow.webContents.executeJavaScript(`console.log('${String(a)}')`);
                });
            }, 2000);

            this.mainWindow.on('closed', () => {
                this.mainWindow = null;
            });

            this.mainWindow.webContents.on('will-navigate', function (event: Event, url: string) {
                if (!url.includes(pack.server)) {
                    event.preventDefault();
                }
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

    private setHandlers() {
        if (this.ignoreSslError) {
            // SSL/TSL: this is the self signed certificate support
            app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
                // On certificate error we disable default behaviour (stop loading the page)
                // and we then say "it is all fine - true" to the callback
                event.preventDefault();
                callback(true);
            });
        }
        app.on('ready', () => this.onAppReady());
        app.on('window-all-closed', Main.onAllWindowClosed);
        app.on('activate', () => this.onActivate());
    }

    private onAppReady() {
        this.registerProtocol();
        this.createWindow();
        this.menu = Menu.buildFromTemplate(MENU_LIST);
        Menu.setApplicationMenu(this.menu);
    }

    private registerProtocol() {
        if (process.platform !== 'linux') {
            app.setAsDefaultProtocolClient(CONFIG.PROTOCOL);
        } else {
            if (!this.noReplaceDesktopFile) {
                this.installDesktopFile();
            }
        }
    }

    private installDesktopFile() {
        const escape = path => path.replace(/\s/g, '\\ ');
        const processDesktopFile = file => file.replace('{{APP_PATH}}', escape(process.execPath));
        const writeDesktop = desktop => write(join(homedir(), '.local', 'share', 'applications', 'waves.desktop'), desktop);

        return read(join(__dirname, 'waves.desktop'))
            .then(processDesktopFile)
            .then(writeDesktop)
            .catch(e => console.error(e));
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
        return readJSON(CONFIG.META_PATH).catch(() => {
            return writeJSON(CONFIG.META_PATH, {}).then(() => ({}));
        }) as Promise<IMetaJSON>;
    }

    private static updateMeta({ x, y, width, height, isFullScreen }) {
        return Main.loadMeta().then((meta) => {
            meta.lastOpen = {
                width, height, x, y, isFullScreen
            };
            return writeJSON(CONFIG.META_PATH, meta);
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
            icon: join(__dirname, 'img', 'icon.png'),
            fullscreen, width, height, x, y,
            webPreferences: {
                preload: join(__dirname, 'preload.js'),
                nodeIntegration: false
            }
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
}

export const main = new Main();
