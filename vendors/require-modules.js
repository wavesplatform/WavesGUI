(function () {
    'use strict';

    const MODULES_MAP = {
        'ts-utils': 'tsUtils',
        'bignumber.js': 'BigNumber',
        'ts-api-validator': 'tsApiValidator'
    };

    if (window.require) {
        const origin = require;
        window.require = function (name) {
            if (name in MODULES_MAP) {
                return window[MODULES_MAP[name]] || origin(name);
            } else {
                return origin(name);
            }
        };
    } else {
        window.require = function (name) {
            if (name in MODULES_MAP) {
                return window[MODULES_MAP[name]];
            } else {
                throw new Error(`Not loaded module with name "${name}"`);
            }
        };
    }

    window.require = window.require || function (name) {
        if (name in MODULES_MAP) {
            return window[MODULES_MAP[name]];
        } else {
            throw new Error(`Not loaded module with name "${name}"`);
        }
    };

})();
