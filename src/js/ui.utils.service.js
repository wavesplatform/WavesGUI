(function () {
    'use strict';

    angular
        .module('app.ui')
        .service('utilsService', ['constants.network', function (networkConstants) {
            this.isTestnet = function () {
                return networkConstants.NETWORK_NAME === 'devel' || networkConstants.NETWORK_NAME === 'testnet';
            };

            this.testnetSubstitutePair = function (pair) {
                var realIds = {};
                realIds[Currency.BTC.id] = '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS';
                realIds[Currency.USD.id] = 'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck';
                realIds[Currency.EUR.id] = 'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU';
                realIds[Currency.CNY.id] = 'DEJbZipbKQjwEiRjx2AqQFucrj5CZ3rAc4ZvFM8nAsoA';

                return {
                    amountAsset: {id: realIds[pair.amountAsset.id] || ''},
                    priceAsset: {id: realIds[pair.priceAsset.id] || realIds[Currency.BTC.id]}
                };
            };
        }]);
})();
