(function () {
    'use strict';

    const controller = function () {

        class Markets {

        }

        return new Markets();
    };

    controller.$inject = [];

    angular.module('app.dex')
        .component('wDexMarkets', {
            templateUrl: '/modules/dex/directives/markets/markets.html'
        });
})();
