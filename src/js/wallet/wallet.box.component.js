(function () {
    'use strict';

    function WalletBoxController() {
        var ctrl = this;

        var mapping = {};
        mapping[Currency.WAV.displayName] = {
            image: 'wB-bg-WAV.svg',
            displayName: Currency.WAV.displayName
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
        mapping[Currency.CNY.displayName] = {
            image: 'wB-bg-RMB.svg',
            displayName: Currency.CNY.displayName
        };

        ctrl.image = mapping[ctrl.balance.currency.displayName].image;
        ctrl.displayName = mapping[ctrl.balance.currency.displayName].displayName;
        ctrl.$onChanges = function (changesObject) {
            if (changesObject.balance) {
                var balance = changesObject.balance.currentValue;
                ctrl.integerBalance = balance.formatIntegerPart();
                ctrl.fractionBalance = balance.formatFractionPart();
            }
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
                onTrade: '&'
            },
            template: '<img ng-src="img/{{::$ctrl.image}}" alt="Chinese Yuan wallet" />' +
                '<div class="wB-name">{{::$ctrl.displayName | uppercase}}</div>' +
                '<div class="wB-add"></div>' +
                '<div class="wB-balInt">{{$ctrl.integerBalance}}</div>' +
                '<div class="wB-balDec">{{$ctrl.fractionBalance}}</div>' +
                '<div class="wB-buttons">' +
                    '<a ng-click="$ctrl.onSend({currency: $ctrl.balance.currency})">' +
                        '<div class="wB-but wB-butSend fade"><p>SEND</p></div>' +
                    '</a>' +
                    '<a ng-click="$ctrl.onWithdraw({currency: $ctrl.balance.currency})">' +
                        '<div class="wB-but wB-butRec fade"><p>WITHDRAW</p></div>' +
                    '</a>' +
                    '<a ng-click="$ctrl.onTrade({currency: $ctrl.balance.currency})">' +
                        '<div class="wB-but wB-butTrade fade"><p>TRADE</p></div>' +
                    '</a>' +
                '</div>'
        });
})();
