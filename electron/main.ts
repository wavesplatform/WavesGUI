///<reference path="node-global-extends.d.ts"/>


import { app, BrowserWindow, screen, Menu } from 'electron';
import loggable from './decorators/loggable';
import { Bridge } from './Bridge';
import { ISize, IMetaJSON, ILastOpen } from './package';
import { join } from 'path';
import {
    hasProtocol,
    read,
    readJSON,
    removeProtocol,
    write,
    writeJSON,
    parseElectronUrl,
    changeLanguage,
    localeReady
} from './utils';
import { homedir } from 'os';
import { execSync } from 'child_process';
import { ARGV_FLAGS, PROTOCOL, MIN_SIZE, FIRST_OPEN_SIZES, META_NAME, GET_MENU_LIST, CONTEXT_MENU } from './constansts';
import { get } from 'https';

import BrowserWindowConstructorOptions = Electron.BrowserWindowConstructorOptions;
import { IPackageJSON } from '../ts-scripts/interface';


const META_PATH = join(app.getPath('userData'), META_NAME);
const argv = Array.prototype.slice.call(process.argv);

@loggable
class Main implements IMain {

    public mainWindow: BrowserWindow;
    public menu: Menu;
    public bridge: Bridge;
    private ctxMenuList: Array<Menu> = [];
    private initializeUrl: string = '';
    private hasDevTools: boolean = false;
    private dataPromise: Promise<IMetaJSON>;
    private lastLoadedVersion: string;
    private readonly pack: IPackageJSON;
    private readonly ignoreSslError: boolean;
    private readonly noReplaceDesktopFile: boolean;

    constructor() {
        const canOpenElectron = this.makeSingleInstance();

        if (!canOpenElectron) {
            return null;
        }

        this.pack = require('./package.json');
        this.ignoreSslError = argv.includes(ARGV_FLAGS.IGNORE_SSL_ERROR);
        this.noReplaceDesktopFile = argv.includes(ARGV_FLAGS.NO_REPLACE_DESKTOP_FILE);

        if (this.ignoreSslError) {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        }

        this.mainWindow = null;
        this.bridge = new Bridge(this);
        this.dataPromise = Main.loadMeta();

        this.setHandlers();
    }

    public reload() {
        Main.loadVersion(this.pack)
            .catch(() => null)
            .then(version => {
                if (version && version === this.lastLoadedVersion) {
                    this.mainWindow.reload();
                } else {
                    const url = this.mainWindow.webContents.getURL();
                    this.mainWindow.loadURL(url, { 'extraHeaders': 'pragma: no-cache\n' });
                    this.lastLoadedVersion = version;
                }
            });
    }

    public setLanguage(lng: string): void {
        changeLanguage(lng);
        this.addContextMenu();
    }

    public addDevTools() {
        this.hasDevTools = true;
        this.addContextMenu();
    }

    private makeSingleInstance(): boolean {
        const isOpenClient = app.makeSingleInstance((argv) => {
            const link = argv.find(hasProtocol) || '';

            this.openProtocolIn(link);
        });

        if (isOpenClient) {
            app.quit();
        }

        return !isOpenClient;
    }

    private openProtocolIn(browserLink) {
        if (!browserLink || !hasProtocol(browserLink)) {
            return null;
        }

        if (this.mainWindow && this.mainWindow.webContents) {
            const url = removeProtocol(browserLink);
            this.mainWindow.webContents.executeJavaScript(`runMainProcessEvent('open-from-browser', '${url}')`);

            if (this.mainWindow.isMinimized()) {
                this.mainWindow.restore();
            }
            this.mainWindow.show();
        } else {
            this.initializeUrl = browserLink;
        }
    }

    private createWindow(): Promise<void> {
        return this.dataPromise.then((meta) => {
            this.mainWindow = new BrowserWindow(Main.getWindowOptions(meta));

            const pack = this.pack;
            const parts = parseElectronUrl(removeProtocol(this.initializeUrl || argv.find(argument => hasProtocol(argument)) || ''));
            const path = parts.path === '/' ? '/' : parts.path.replace(/\/$/, '');
            const url = `${path}${parts.search}${parts.hash}`;

            this.mainWindow.loadURL(`https://${pack.server}/#!${url}`, { 'extraHeaders': 'pragma: no-cache\n' });

            Main.loadVersion(pack)
                .catch(() => null)
                .then(version => {
                    this.lastLoadedVersion = version;
                });

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


    // private log(message: string): void {
    //     const command = `console.log('${message}');`
    //     this.mainWindow.webContents.executeJavaScript(command);
    //     console.log(message);
    // }

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
        app.on('open-url', (event, url) => {
            event.preventDefault();
            this.openProtocolIn(url);
        });
    }

    private onAppReady() {
        this.registerProtocol()
            .then(() => this.createWindow())
            .then(() => this.addContextMenu())
    }

    private addContextMenu(): Promise<void> {
        Menu.setApplicationMenu(null);
        return localeReady.then(t => {
            this.createAppMenu(t);
            this.createCtxMenu(t);
        });
    }

    private createAppMenu(locale) {
        const menuList = GET_MENU_LIST(app, locale, this.hasDevTools);
        this.menu = Menu.buildFromTemplate(menuList);
        Menu.setApplicationMenu(this.menu);
    }

    private createCtxMenu(locale) {
        const onContextMenu = (menu: Menu): () => void => () => menu.popup({});
        if (this.ctxMenuList.length > 0) {
            this.mainWindow.webContents.removeAllListeners('context-menu');
        }
        const ctxMenuTemplate = CONTEXT_MENU(locale);
        const ctxMenu = Menu.buildFromTemplate(ctxMenuTemplate);
        this.ctxMenuList.push(ctxMenu);
        this.mainWindow.webContents.on('context-menu',  onContextMenu(ctxMenu));
    }

    private registerProtocol(): Promise<void> {
        if (this.noReplaceDesktopFile) {
            return Promise.resolve();
        }

        return Main.loadMeta()
            .then(meta => {
                const execPath = process.execPath;

                if (meta.lastOpen && meta.lastOpen.setProtocolStatus && meta.lastOpen.lastOpenPath === execPath) {
                    return void 0;
                }

                const setProtocolResult = app.setAsDefaultProtocolClient(PROTOCOL.replace('://', ''));

                if (setProtocolResult) {
                    return Main.updateMeta({
                        lastOpenPath: execPath,
                        setProtocolStatus: true
                    });
                }

                if (process.platform === 'linux') {
                    return this.installDesktopFile();
                }

                this.showSetProtocolError();
            });
    }

    private showSetProtocolError(error?: Error): void {
        // const pack = require('./package.json');
        //
        // const details = {
        //     os: platform(),
        //     clientVersion: pack.version,
        //     error: String(error)
        // };
        //
        // const makeUrkWithParams = url => {
        //     return url + '?' + Object.keys(details)
        //         .map(name => ({ name, value: details[name] }))
        //         .reduce((acc, item) => acc + `${name}=${encodeURIComponent(item.value)}&`, '');
        // };
        //
        // this.localeReadyPromise.then(t => {
        //     dialog.showMessageBox({
        //             type: 'warning',
        //             buttons: [t('modal.set_protocol_error.close'), t('modal.set_protocol_error.report')],
        //             defaultId: 0,
        //             cancelId: 0,
        //             title: t('modal.set_protocol_error.title'),
        //             message: t('modal.set_protocol_error.message'),
        //             detail: JSON.stringify(details, null, 4)
        //         },
        //         response => {
        //             if (response === 1) {
        //                 shell.openExternal(makeUrkWithParams('https://bug-report'));
        //             }
        //         });
        // });
    }

    private installDesktopFile() {
        const escape = path => path.replace(/\s/g, '\\ ');
        const processDesktopFile = file => file.replace('{{APP_PATH}}', escape(process.execPath));
        const writeDesktop = desktop => write(join(homedir(), '.local', 'share', 'applications', 'waves.desktop'), desktop);
        const registerProtocolHandler = () => {
            execSync('xdg-mime default waves.desktop x-scheme-handler/waves');
        };

        return read(join(__dirname, 'waves.desktop'))
            .then(processDesktopFile)
            .then(writeDesktop)
            .then(registerProtocolHandler)
            .catch((error) => this.showSetProtocolError(error));
    }

    private onActivate() {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (!this.mainWindow) {
            this.createWindow();
        }
    }

    private static onAllWindowClosed() {
        app.quit();
    }

    private static loadMeta(): Promise<IMetaJSON> {
        return readJSON(META_PATH).catch(() => {
            return writeJSON(META_PATH, {}).then(() => ({}));
        }) as Promise<IMetaJSON>;
    }

    private static updateMeta(data: Partial<ILastOpen>) {
        return Main.loadMeta().then((meta) => {
            meta.lastOpen = { ...meta.lastOpen || Object.create(null), ...data, };
            return writeJSON(META_PATH, meta);
        });
    }

    private static loadVersion(pack: IPackageJSON): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const httpGet = get(`https://${pack.server}/package.json?${Date.now()}`, res => {
                let data = new Buffer('');

                // A chunk of data has been recieved.
                res.on('data', (chunk: Buffer) => {
                    data = Buffer.concat([data, chunk]);
                });

                // The whole response has been received. Print out the result.
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data.toString()).version);
                    } catch (e) {
                        reject();
                    }
                });

                res.on('error', e => {
                    reject(e);
                });
            });
            httpGet.on('error', reject);
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
            minWidth: MIN_SIZE.WIDTH,
            minHeight: MIN_SIZE.HEIGHT,
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
            Math.min(size.width, FIRST_OPEN_SIZES.MAX_SIZE.WIDTH),
            FIRST_OPEN_SIZES.MIN_SIZE.WIDTH
        );
        const height = Math.max(
            Math.min(size.height, FIRST_OPEN_SIZES.MAX_SIZE.HEIGHT),
            FIRST_OPEN_SIZES.MIN_SIZE.HEIGHT
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

export const main = global.main = new Main();
