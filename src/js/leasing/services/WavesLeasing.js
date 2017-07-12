(function () {
    'use strict';

    const DEFAULT_CURRENCY = Currency.WAVES;

    function WavesLeasing(apiService) {
        function parseBalance(response) {
            return Money.fromCoins(response.balance, DEFAULT_CURRENCY);
        }

        this.loadBalanceDetails = function (address) {
            const details = {};
            return apiService.address.balance(address)
                .then((response) => {
                    details.regular = parseBalance(response);

                    return apiService.address.effectiveBalance(address);
                })
                .then((response) => {
                    details.effective = parseBalance(response);

                    return apiService.address.generatingBalance(address);
                })
                .then((response) => {
                    details.generating = parseBalance(response);

                    return details;
                });
        };
    }

    WavesLeasing.$inject = [`apiService`];

    angular
        .module(`app.leasing`)
        .service(`leasingService`, WavesLeasing);
})();
