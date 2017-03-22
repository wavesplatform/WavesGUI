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

    function WavesCardDepositController ($scope, $window, $q, events, dialogService, fiatService, applicationContext,
                                         notificationService) {
        var deferred;
        var card = this;
        card.currencies = [new FiatCurrency('EURO', 'Euro'), new FiatCurrency('USD')];
        card.payAmount = DEFAULT_AMOUNT_TO_PAY;
        card.payCurrency = card.currencies[0];
        card.limits = {};
        card.updateReceiveAmount = updateReceiveAmount;
        card.updateLimitsAndReceiveAmount = updateLimitsAndReceiveAmount;
        card.redirectToMerchant = redirectToMerchant;

        $scope.$on(events.WALLET_CARD_DEPOSIT, function (event, eventData) {
            dialogService.open('#card-deposit-dialog');

            updateLimitsAndReceiveAmount();
        });

        function updateLimitsAndReceiveAmount() {
            fiatService.getLimits(applicationContext.account.address, card.payCurrency.code)
                .then(function (response) {
                    card.limits = {
                        min: Number(response.min),
                        max: Number(response.max)
                    };
                }).catch(function (response) {
                    notificationService.error(response.message);
                });

            updateReceiveAmount();
        }

        function updateReceiveAmount() {
            if (deferred) {
                deferred.reject();
            }

            deferred = $q.defer();
            deferred.promise.then(function (response) {
                card.getAmount = response;
            }).catch(function (value) {
                if (value && value.message)
                    notificationService.error(value.message);
            });

            fiatService.getRate(applicationContext.account.address, card.payAmount, card.payCurrency.code)
                .then(deferred.resolve).catch(deferred.reject);
        }

        function redirectToMerchant() {
            try {
                validateAmountToPay();

                var url = fiatService.getMerchantUrl(applicationContext.account.address,
                    card.payAmount, card.payCurrency.code);
                $window.open(url, '_blank');

                return true;
            }
            catch (exception) {
                notificationService.error(exception.message);

                return false;
            }
        }

        function validateAmountToPay() {
            if (Number(card.payAmount) < card.limits.min)
                throw new Error('Minimum amount to pay is ' + card.limits.min + ' ' + card.payCurrency.displayName);

            if (Number(card.payAmount) > card.limits.max)
                throw new Error('Maximum amount to pay is ' + card.limits.max + ' ' + card.payCurrency.displayName);
        }
    }

    WavesCardDepositController.$inject = ['$scope', '$window', '$q', 'wallet.events', 'dialogService',
        'coinomatFiatService', 'applicationContext', 'notificationService'];

    angular
        .module('app.wallet')
        .controller('cardDepositController', WavesCardDepositController);
})();
