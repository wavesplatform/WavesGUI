///<reference path="../node_modules/electron/electron.d.ts"/>


interface IMain {
    mainWindow: Electron.BrowserWindow;
    menu: Electron.Menu;
    bridge: IBridge;

    reload(): void;

    setLanguage(lng: string): void;

    addDevTools(): void;
}

interface IBridge {
    transfer(command: string, data: object): Promise<any>;
}

