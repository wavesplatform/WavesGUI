(function () {
    'use strict';

    const REGEX = {
        bitcoin: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/
    };

    const factory = function () {
        return {

            [WavesApp.defaultAssets.BTC]: {
                isValidAddress(string) {
                    return REGEX.bitcoin.test(string);
                }
            }

        };
    };

    angular.module('app.utils').factory('outerBlockchains', factory);
})();
