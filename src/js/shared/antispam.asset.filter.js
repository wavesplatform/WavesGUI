(function () {
    'use strict';

    var DEFAULT_ASSET_ID_FIELD_NAME = 'assetId';

    function AntiSpamFilter(spamAssetService) {
        return function filterInput(input, fieldName) {
            if (!input) {
                return [];
            }

            fieldName = fieldName || DEFAULT_ASSET_ID_FIELD_NAME;

            return _.filter(input, function (tx) {
                return !spamAssetService.isSpam(tx[fieldName]);
            });
        };
    }

    AntiSpamFilter.$inject = ['spamAssetService'];

    angular
        .module('app.shared')
        .filter('antiSpam', AntiSpamFilter);
})();
