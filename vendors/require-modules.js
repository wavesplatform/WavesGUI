(function () {
    'use strict';

    const MODULES_MAP = {
        'ts-utils': 'tsUtils'
    };

    window.require = function (name) {
        if (name in MODULES_MAP) {
            return window[MODULES_MAP[name]];
        }
    };

})();
