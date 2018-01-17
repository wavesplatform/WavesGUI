(function () {
    'use strict';

    const MODULES_MAP = {
        'ts-utils': 'tsUtils',
        'bignumber.js': 'BigNumber',
        'ts-api-validator': 'tsApiValidator'
    };

    window.require = function (name) {
        if (name in MODULES_MAP) {
            return window[MODULES_MAP[name]];
        } else {
            throw new Error(`Not loaded module with name "${name}"`);
        }
    };

})();
