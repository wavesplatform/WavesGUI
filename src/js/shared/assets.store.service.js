(function () {
    'use strict';

    var store = {};

    store[Currency.WAV.id] = _.extend({verified: true}, Currency.WAV);
    store[Currency.BTC.id] = _.extend({verified: true}, Currency.BTC);
    // TODO : expand this list.

    angular
        .module('app.shared')
        .service('assetStoreService', [function () {
            var self = this;

            self.complementOne = function (asset) {
                if (store[asset.assetId]) {
                    asset.verified = store[asset.id].verified;
                    asset.shortName = store[asset.id].shortName;
                } else {
                    asset.shortName = asset.displayName;
                }
                return asset;
            };

            self.complement = function (assets) {
                // TODO : add missing assets.
                return assets.map(self.complementOne);
            };

        }]);
})();
