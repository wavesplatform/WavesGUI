(function () {
    'use strict';

    function WavesAssetDetailsController($scope, $timeout, events, applicationContext, dialogService) {
        var details = this;

        function transformAddress(address) {
            return isMyAddress(address) ? 'You' : address;
        }

        function isMyAddress(address) {
            return address === applicationContext.account.address;
        }

        $scope.$on(events.ASSET_DETAILS, function (event, assetId) {
            var asset = applicationContext.cache.assets[assetId];
            if (angular.isUndefined(asset)) {
                throw new Error('Failed to find asset details by id ' + assetId);
            }

            details.assetId = assetId;
            details.name = asset.currency.displayName;
            details.description = asset.description;
            details.sender = transformAddress(asset.sender);
            details.isSenderCopiable = !isMyAddress(asset.sender);
            details.timestamp = asset.timestamp;
            details.totalTokens = asset.totalTokens.formatAmount();
            details.reissuable = asset.reissuable ? 'Yes' : 'No';

            $timeout(function () {
                dialogService.open('#asset-details-dialog');
            }, 1);
        });
    }

    WavesAssetDetailsController.$inject = ['$scope', '$timeout', 'portfolio.events', 'applicationContext',
        'dialogService'];

    angular
        .module('app.portfolio')
        .controller('assetDetailsController', WavesAssetDetailsController);
})();
