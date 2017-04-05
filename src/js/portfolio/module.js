(function() {
    'use strict';

    angular.module('app.portfolio', ['app.shared'])
        .constant('portfolio.events', {
            ASSET_TRANSFER: 'asset-transfer',
            ASSET_REISSUE: 'asset-reissue',
            ASSET_DETAILS: 'asset-details',
            ASSET_MASSPAY: 'asset-masspay'
        });
})();
