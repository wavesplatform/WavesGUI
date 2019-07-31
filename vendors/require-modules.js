(function () {
    'use strict';

    const MODULES_MAP = {
        'ts-utils': 'tsUtils',
        '@waves/bignumber': 'BigNumber',
        'ts-api-validator': 'tsApiValidator',
        'parse-json-bignumber': 'parseJsonBignumber',
        'papaparse': 'Papa',
        'waves-api': 'WavesAPI',
        'identity-img': 'identityImg',
        '@waves/data-entities': 'dataEntities',
        '@waves/waves-transactions': 'WavesTransactions',
        '@waves/waves-crypto': 'WavesCrypto',
        '@waves/ledger/dist/transport-u2f': 'TransportU2F',
        '@ledgerhq/hw-transport-u2f': 'TransportU2F',
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
            if (name in MODULES_MAP && Object.prototype.hasOwnProperty.call(MODULES_MAP, name)) {
                return tsUtils.get(window, MODULES_MAP[name]);
            } else if (require) {
                return require(name);
            } else {
                throw new Error(`Not loaded module with name "${name}`);
            }
        };
    }

    window.require = getModule(window.require);
})();
