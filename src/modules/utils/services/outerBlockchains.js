(function () {
    'use strict';

    const REGEX = {
        [WavesApp.defaultAssets.BTC]: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
        [WavesApp.defaultAssets.ETH]: /^0x[0-9a-f]{40}$/i,
        [WavesApp.defaultAssets.LTC]: /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$/,
        [WavesApp.defaultAssets.ZEC]: /^t[0-9a-z]{34}$/i,
        [WavesApp.defaultAssets.BCH]: /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|[qp][a-zA-Z0-9]{41})$/,
        [WavesApp.defaultAssets.DASH]: /^X[a-km-zA-HJ-NP-Z1-9]{25,34}$/
    };

    const factory = function () {
        return Object.keys(REGEX).reduce((result, key) => {
            result[key] = {
                isValidAddress(string) {
                    return REGEX[key].test(string);
                }
            };
            return result;
        }, Object.create(null));
    };

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
