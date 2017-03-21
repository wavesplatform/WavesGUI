(function () {
    'use strict';

    var DEFAULT_AMOUNT_TO_PAY = 25;

    function FiatCurrency (code, displayName) {
        this.code = code;
        if (displayName)
            this.displayName = displayName;
        else
            this.displayName = code;
    }

    function WavesCardDepositController ($scope, $window, events, dialogService, fiatService, applicationContext) {
        var card = this;
        card.currencies = [new FiatCurrency('EURO', 'Euro'), new FiatCurrency('USD')];
        card.payAmount = DEFAULT_AMOUNT_TO_PAY;
        card.payCurrency = card.currencies[0];
        card.validationOptions = {
            onfocusout: false,
            rules: {
                payAmount: {}
            },
            messages: {
                payAmount: {}
            }
        };

        card.updateReceiveAmount = updateReceiveAmount;
        card.redirectToMerchant = redirectToMerchant;

        $scope.$on(events.WALLET_CARD_DEPOSIT, function (event, eventData) {
            dialogService.open('#card-deposit-dialog');

            fiatService.getLimits(applicationContext.account.address, card.payCurrency.code)
                .then(function (response) {
                    card.validationOptions.rules.payAmount.min = response.min;
                    card.validationOptions.rules.payAmount.max = response.max;
                    card.validationOptions.messages.payAmount.min = 'Minimum amount to pay is ' +
                        response.min + ' ' + card.payCurrency.displayName;
                    card.validationOptions.messages.payAmount.max = 'Maximum amount to pay is ' +
                        response.max + ' ' + card.payCurrency.displayName;

                    return updateReceiveAmount();
                });
        });

        function updateReceiveAmount() {
            return fiatService.getRate(applicationContext.account.address, card.payAmount, card.payCurrency.code)
                .then(function (response) {
                    card.getAmount = response;
                });
        }

        function redirectToMerchant() {
            var url = fiatService.getMerchantUrl(applicationContext.account.address,
                card.payAmount, card.payCurrency.code);
            $window.open(url, '_blank');
        }
    }

    WavesCardDepositController.$inject = ['$scope', '$window', 'wallet.events', 'dialogService', 'coinomatFiatService',
        'applicationContext'];

    angular
        .module('app.wallet')
        .controller('cardDepositController', WavesCardDepositController);
})();
