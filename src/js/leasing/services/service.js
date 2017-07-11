(function () {
    'use strict';

    var DEFAULT_CURRENCY = Currency.WAVES;

    function WavesLeasingService (apiService) {
        function parseBalance(response) {
            return Money.fromCoins(response.balance, DEFAULT_CURRENCY);
        }

        this.loadBalanceDetails = function (address) {
            var details = {};
            return apiService.address.balance(address)
                .then(function (response) {
                    details.regular = parseBalance(response);

                    return apiService.address.effectiveBalance(address);
                })
                .then(function (response) {
                    details.effective = parseBalance(response);

                    return apiService.address.generatingBalance(address);
                })
                .then(function (response) {
                    details.generating = parseBalance(response);

                    return details;
                });
        };
    }

    WavesLeasingService.$inject = ['apiService'];

    angular
        .module('app.leasing')
        .service('leasingService', WavesLeasingService);
})();
