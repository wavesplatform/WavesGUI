(function () {
    'use strict';

    function FavoritesController() {
        var ctrl = this;

        ctrl.onClick = function (pair) {
            ctrl.switchPair({
                amountAsset: pair.amountAsset,
                priceAsset: pair.priceAsset
            });
        };
    }

    angular
        .module('app.dex')
        .component('wavesDexFavorites', {
            controller: FavoritesController,
            bindings: {
                pairs: '<',
                switchPair: '<'
            },
            templateUrl: 'dex/favorites.component'
        });
})();
