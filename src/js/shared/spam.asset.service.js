(function () {
    'use strict';

    // TODO: init spam assets
    var spamAssets = {};
    var hasBeenUpdated = false;
    var isPendingUpdate = false;
    var SPAM_ASSET_LIST_URL = 'https://raw.githubusercontent.com/wavesplatform/waves-community/' +
        'master/Scam%20tokens%20according%20to%20the%20opinion%20of%20Waves%20Community.csv';

    angular
        .module('app.shared')
        .service('spamAssetService', ['$http', function ($http) {
            this.isSpam = function (assetId) {
                if (!assetId) {
                    return false;
                }

                var result = !spamAssets[assetId];

                if (!hasBeenUpdated && !isPendingUpdate) {
                    isPendingUpdate = true;
                    $http.get(SPAM_ASSET_LIST_URL).then(function (response) {
                        // TODO: update spamAssets map
                    }).catch(function () {
                        // do nothing
                    }).then(function () {
                        // if we failed to update spam asset list, there is no need to try again
                        isPendingUpdate = false;
                        hasBeenUpdated = true;
                    });
                }

                return result;
            };
        }]);
})();
