(function () {
    'use strict';

    function Favorites() {
        const ctrl = this;

        ctrl.onClick = function (pair) {
            ctrl.switchPair({
                amountAsset: pair.amountAsset,
                priceAsset: pair.priceAsset
            });
        };
    }

    angular
        .module(`app.dex`)
        .component(`wavesDexFavorites`, {
            controller: Favorites,
            bindings: {
                pairs: `<`,
                switchPair: `<`
            },
            templateUrl: `dex/favorites.component`
        });
})();
