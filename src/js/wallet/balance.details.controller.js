(function () {
    'use strict';

    function WavesBalanceDetailsController ($scope, events, dialogService) {
        var balance = this;

        $scope.$on(events.WALLET_DETAILS, function (event, eventData) {
            dialogService.open('#balance-details-dialog');
        });
    }

    WavesBalanceDetailsController.$inject = ['$scope', 'wallet.events', 'dialogService'];

    angular
        .module('app.wallet')
        .controller('balanceDetailsController', WavesBalanceDetailsController);
})();
