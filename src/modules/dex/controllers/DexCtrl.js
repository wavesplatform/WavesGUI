(function () {
    'use strict';

    const controller = function () {

        class DexCtrl {

            constructor() {
                this.portfolioAssets = [
                    { name: 'Waves', balance: 3452.23998933, currency: 'waves' },
                    { name: 'Bitcoin', balance: 5.23998933, currency: 'btc' },
                    { name: 'Ethereum', balance: 3452.23998933, currency: 'eth' },
                    { name: 'Euro', balance: 3452.23, currency: 'eur' },
                    { name: 'US Dollar', balance: 3452.23, currency: 'usd' }
                ];
            }

        }

        return new DexCtrl();
    };


    controller.$inject = [];

    angular.module('app.dex')
        .controller('DexCtrl', controller);
})();
