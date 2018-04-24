(function () {
    'use strict';

    var MODULES_MAP = {
        'ts-utils': 'tsUtils',
        'bignumber.js': 'BigNumber',
        'ts-api-validator': 'tsApiValidator',
        'parse-json-bignumber': 'parseJsonBignumber',
        'papaparse': 'Papa',
        'waves-api': 'WavesAPI',
        'identity-img': 'identityImg'
    };

    if (window.require) {
        var origin = require;
        window.require = function (name) {
            if (name in MODULES_MAP) {
                return window[MODULES_MAP[name]] || origin(name);
            } else {
                try {
                    return angular.element(document).injector().get(name);
                } catch (e) {
                    return origin(name);
                }
            }
        };
    } else {
        window.require = function (name) {
            if (name in MODULES_MAP) {
                return window[MODULES_MAP[name]];
            } else {
                try {
                    return angular.element(document).injector().get(name);
                } catch (e) {
                    throw new Error('Not loaded module with name "' + name);
                }
            }
        };
    }

})();
