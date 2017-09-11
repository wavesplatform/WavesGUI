(function () {
    'use strict';

    angular.module('app.wallet.assets').component('wAsset', {
        bindings: {
            asset: '<',
            onClick: '&'
        },
        templateUrl: 'modules/wallet/modules/assets/directives/asset/asset.html'
    });
})();
