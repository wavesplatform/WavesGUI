(function () {
    'use strict';

    function WavesAssetTransferController($scope, events, autocomplete, applicationContext) {
        var transfer = this;

        transfer.availableBalance = 0;
        transfer.confirm = {
            pendingTransfer: false
        };
        transfer.autocomplete = angular.copy(autocomplete);
        transfer.validationOptions = {};

        $scope.$on(events.ASSET_SELECTED, function (event, assetId) {
            var asset = applicationContext.cache.assets[assetId];
            transfer.availableBalance = asset.balance.formatAmount();
        });
    }

    WavesAssetTransferController.$inject = ['$scope', 'portfolio.events', 'autocomplete.fees', 'applicationContext'];

    angular
        .module('app.portfolio')
        .controller('assetTransferController', WavesAssetTransferController);
})();
