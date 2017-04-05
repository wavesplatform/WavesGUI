(function () {
    'use strict';

    var DEFAULT_FEE_AMOUNT = '0.001';
    var FEE_CURRENCY = Currency.WAV;

    function WavesLeasingController ($scope, $timeout, events, autocomplete, dialogService, notificationService) {
        var leasing = this;
        leasing.autocomplete = autocomplete;
        leasing.availableBalance = Money.fromCoins(0, Currency.WAV);
        leasing.confirmLease = confirmLease;

        reset();

        $scope.$on(events.WALLET_LEASE, function (event, eventData) {
            //FIXME: add here a correct value available to lease
            leasing.availableBalance = eventData.balanceDetails.effective;

            reset();

            $timeout(function () {
                dialogService.open('#start-leasing-dialog');
            }, 1);
        });

        function confirmLease(form) {

            // open confirmation dialog
            // doing it async because this method is called while another dialog is open
            $timeout(function () {
                dialogService.open('#start-leasing-confirmation');
            }, 1);
        }

        function reset() {
            leasing.amount = 0;
            leasing.recipient = '';
            leasing.fee = {
                amount: DEFAULT_FEE_AMOUNT,
                isValid: true
            };
            leasing.autocomplete.defaultFee(Number(DEFAULT_FEE_AMOUNT));
        }
    }

    WavesLeasingController.$inject = ['$scope', '$timeout', 'wallet.events', 'autocomplete.fees',
        'dialogService', 'notificationService'];

    angular
        .module('app.wallet')
        .controller('leasingController', WavesLeasingController);
})();
