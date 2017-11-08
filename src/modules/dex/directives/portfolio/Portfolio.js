(function () {
    'use strict';

    angular.module('app.dex')
        .component('wDexPortfolio', {
            bindings: {
                assets: '<'
            },
            templateUrl: 'modules/dex/directives/portfolio/portfolio.html'
        });
})();
