(function () {
    'use strict';

    var MODULES_MAP = {
        'ts-utils': 'tsUtils',
        'bignumber.js': 'BigNumber',
        'ts-api-validator': 'tsApiValidator',
        'parse-json-bignumber': 'parseJsonBignumber',
        '@waves/marshall': 'WavesMarshall',
        'papaparse': 'Papa',
        'waves-api': 'WavesAPI',
        'identity-img': 'identityImg',
        '@waves/data-entities': 'dataEntities',
        '@waves/signature-generator': 'wavesSignatureGenerator',
        '@ledgerhq/hw-transport-u2f': 'TransportU2F',
        '@ledgerhq/hw-transport-node-hid': 'TransportU2F',
        '@waves/ledger': 'WavesLedgerJs',
        '@waves/signature-adapter': 'wavesSignatureAdapter',
        'ramda': 'R',
        'data-service': 'ds',
        'handlebars': 'Handlebars',
        '@waves/waves-browser-bus': 'bus',
        'worker-wrapper': 'workerWrapper',
        '@waves/oracle-data': 'OracleDataProvider',
        'jquery': '$',
        'i18next': 'i18next',
        '@waves/event-sender': 'analytics'
    };

    function getModule(require) {
        return function (name) {
            if (name in MODULES_MAP && MODULES_MAP.hasOwnProperty(name)) {
                return tsUtils.get(window, MODULES_MAP[name]);
            } else if (require) {
                return require(name);
            } else {
                throw new Error('Not loaded module with name "' + name);
            }
        };
    }

    window.require = getModule(window.require);
})();
