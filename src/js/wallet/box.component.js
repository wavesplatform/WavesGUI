(function () {
    'use strict';

    function WalletBoxController() {
        var ctrl = this;

        var mapping = {};
        mapping[Currency.WAVES.displayName] = {
            image: 'wB-bg-WAV.svg',
            displayName: Currency.WAVES.displayName
        };
        mapping[Currency.BTC.displayName] = {
            image: 'wB-bg-BTC.svg',
            displayName: Currency.BTC.displayName
        };
        mapping[Currency.USD.displayName] = {
            image: 'wB-bg-USD.svg',
            displayName: Currency.USD.displayName
        };
        mapping[Currency.EUR.displayName] = {
            image: 'wB-bg-EUR.svg',
            displayName: Currency.EUR.displayName
        };
        mapping[Currency.ETH.displayName] = {
            image: 'wB-bg-ETH.svg',
            displayName: Currency.ETH.displayName
        };
        mapping[Currency.LTC.displayName] = {
            image: 'wB-bg-LTC.svg',
            displayName: Currency.LTC.displayName
        };
        mapping[Currency.ZEC.displayName] = {
            image: 'wB-bg-ZEC.svg',
            displayName: Currency.ZEC.displayName
        };
        mapping[Currency.TRY.displayName] = {
            image: 'wB-bg-WTRY.png',
            displayName: Currency.TRY.displayName
        };
        mapping[Currency.BCH.displayName] = {
            image: 'wB-bg-BCH.svg',
            displayName: 'BCH'
        };

        ctrl.$onChanges = function (changesObject) {
            if (changesObject.balance) {
                var balance = changesObject.balance.currentValue;
                ctrl.integerBalance = balance.formatIntegerPart();
                ctrl.fractionBalance = balance.formatFractionPart();
            }
        };
        ctrl.$onInit = function () {
            ctrl.image = mapping[ctrl.balance.currency.displayName].image;
            ctrl.displayName = mapping[ctrl.balance.currency.displayName].displayName;
        };
    }

    WalletBoxController.$inject = [];

    angular
        .module('app.wallet')
        .component('walletBox', {
            controller: WalletBoxController,
            bindings: {
                balance: '<',
                onSend: '&',
                onWithdraw: '&',
                onDeposit: '&',
                detailsAvailable: '<?'
            },
            templateUrl: 'wallet/box.component'
        });
})();
