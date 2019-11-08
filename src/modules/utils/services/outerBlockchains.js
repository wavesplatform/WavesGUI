(function () {
    'use strict';

    const factory = function (waves) {

        const VALIDATOR = {
            [WavesApp.defaultAssets.BTC]: WavesApp.network.code === 'W' ?
                /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|(bc1)[a-z0-9]{25,90})$/ :
                /^[2mn][1-9A-HJ-NP-Za-km-z]{26,35}/,
            [WavesApp.defaultAssets.ETH]: /^0x[0-9a-f]{40}$/i,
            [WavesApp.defaultAssets.LTC]: /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$/,
            [WavesApp.defaultAssets.ZEC]: /^t[0-9a-z]{34}$/i,
            [WavesApp.defaultAssets.BCH]: /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|[qp][a-zA-Z0-9]{41})$/,
            [WavesApp.defaultAssets.BSV]: /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|[qp][a-zA-Z0-9]{41})$/,
            [WavesApp.defaultAssets.DASH]: /^X[a-km-zA-HJ-NP-Z1-9]{25,34}$/,
            [WavesApp.defaultAssets.XMR]: /^([a-km-zA-HJ-NP-Z1-9]{95}|[a-km-zA-HJ-NP-Z1-9]{106})$/,
            [WavesApp.defaultAssets.WEST]: address => {
                return waves.node.isValidAddressWithNetworkByte(address, WavesApp.network.WESTNetworkByte);
            },
            [WavesApp.defaultAssets.ERGO]: /^9[a-km-zA-HJ-NP-Z1-9]{5,}$/,
            [WavesApp.defaultAssets.BNT]: /^0x[0-9a-f]{40}$/i
        };

        return Object.keys(VALIDATOR).reduce((result, key) => {
            result[key] = {
                isValidAddress(string) {
                    if (typeof VALIDATOR[key] === 'function') {
                        return VALIDATOR[key](string);
                    } else {
                        return VALIDATOR[key].test(string);
                    }
                }
            };
            return result;
        }, Object.create(null));
    };

    factory.$inject = [
        'waves'
    ];

    angular.module('app.utils').factory('outerBlockchains', factory);
})();

/**
 * @typedef {function} IIsValidAddress
 * @param {string} address
 * @return {boolean}
 */

/**
 * @typedef {Object.<string, IIsValidAddress>} IOuterBlockchains
 */
