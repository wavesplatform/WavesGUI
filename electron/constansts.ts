import MenuItemConstructorOptions = Electron.MenuItemConstructorOptions;


export const META_NAME = 'meta.json';

export const MIN_SIZE = {
    WIDTH: 400,
    HEIGHT: 500
};

export const FIRST_OPEN_SIZES = {
    MIN_SIZE: {
        WIDTH: 1024,
        HEIGHT: 768
    },
    MAX_SIZE: {
        WIDTH: 1440,
        HEIGHT: 960
    }
};

export const PROTOCOL = 'waves://';

export const ARGV_FLAGS = {
    IGNORE_SSL_ERROR: '--ignore-ssl-error',
    NO_REPLACE_DESKTOP_FILE: '--no-replace-desktop'
};

export const GET_MENU_LIST = app => [
    {
        label: 'Application',
        submenu: [
            { label: 'Quit', accelerator: 'Command+Q', click: () => app.quit() }
        ]
    },
    {
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
    }
] as MenuItemConstructorOptions[];
