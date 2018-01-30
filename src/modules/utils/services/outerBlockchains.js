(function () {
    'use strict';

    const REGEX = {
        bitcoin: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
        ethereum: /^0x[0-9a-f]{40}$/i,
        litecoin: /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$/,
        zcash: /^t[0-9a-z]{34}$/i
    };

    const factory = function () {
        return {

            [WavesApp.defaultAssets.BTC]: {
                isValidAddress(string) {
                    return REGEX.bitcoin.test(string);
                }
            },

            [WavesApp.defaultAssets.ETH]: {
                isValidAddress(string) {
                    return REGEX.ethereum.test(string);
                }
            },

            [WavesApp.defaultAssets.LTC]: {
                isValidAddress(string) {
                    return REGEX.litecoin.test(string);
                }
            },

            [WavesApp.defaultAssets.ZEC]: {
                isValidAddress(string) {
                    return REGEX.zcash.test(string);
                }
            }

        };
    };

    angular.module('app.utils').factory('outerBlockchains', factory);
})();
