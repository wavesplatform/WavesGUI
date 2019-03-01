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

export const GET_MENU_LIST = (app, t, hasDevTools) => [
    {
        label: t('menu.title.application'),
        submenu: [
            { label: t('menu.quit'), accelerator: 'Command+Q', click: () => app.quit() }
        ]
    },
    {
        label: t('menu.title.edit'),
        submenu: [
            { label: t('menu.cut'), accelerator: 'CmdOrCtrl+X', role: 'cut' },
            { label: t('menu.copy'), accelerator: 'CmdOrCtrl+C', role: 'copy' },
            { label: t('menu.paste'), accelerator: 'CmdOrCtrl+V', role: 'paste' }
        ]
    },
    hasDevTools ? {
        label: t('menu.title.god_mode'),
        submenu: [
            {
                label: t('menu.dev_tools'), role: 'toggledevtools'
            }
        ]
    } : null
].filter(Boolean) as MenuItemConstructorOptions[];

export const CONTEXT_MENU = t => [
    { label: t('menu.cut'), accelerator: 'CmdOrCtrl+X', role: 'cut' },
    { label: t('menu.copy'), accelerator: 'CmdOrCtrl+C', role: 'copy' },
    { label: t('menu.paste'), accelerator: 'CmdOrCtrl+V', role: 'paste' }
];
