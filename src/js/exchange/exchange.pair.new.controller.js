(function () {
    'use strict';

    function WavesExchangePairNewController ($scope, events, $q, apiService, dialogService, notificationService) {
        var newPair = this;

        newPair.firstAssetId = '';
        newPair.secondAssetId = '';
        newPair.showPairMarket = showPairMarket;

        $scope.$on(events.EXCHANGE_OPEN_NEW_PAIR, function (event, eventData) {
            dialogService.open('#exchange-pair-new-dialog');
        });

        function showPairMarket () {
            if (newPair.firstAssetId === newPair.secondAssetId) {
                notificationService.error('You can\'t exchange the same asset');

                return false;
            }

            var promises = [];
            if (newPair.firstAssetId)
                promises.push(
                    apiService.transactions.info(newPair.firstAssetId).then(function () {}, function (value) {
                        notificationService.error('Asset with ID ' + newPair.firstAssetId +
                            ' hasn\'t been found on the blockchain');

                        throw new Error();
                    })
                );

            if (newPair.secondAssetId)
                promises.push(
                    apiService.transactions.info(newPair.secondAssetId).then(function () {}, function (value) {
                        notificationService.error('Asset with ID ' + newPair.secondAssetId +
                            ' hasn\'t been found on the blockchain');

                        throw new Error();
                    })
                );

            $q.all(promises).then(function () {
                // if we got here, then all asset ids are correct
                // open the pair market page
                $scope.$emit(events.EXCHANGE_SHOW_PAIR_MARKET, {
                    firstAssetId: newPair.firstAssetId,
                    secondAssetId: newPair.secondAssetId
                });

                // closing the new pair dialog
                dialogService.close();
            }).catch(function (ex) {
                console.log(ex.message);
            });

            // we do not want to close the dialog right now
            return false;
        }
    }

    WavesExchangePairNewController.$inject = ['$scope', 'exchange.events',
        '$q', 'apiService', 'dialogService', 'notificationService'];

    angular
        .module('app.exchange')
        .controller('exchangePairNewController', WavesExchangePairNewController);
})();
