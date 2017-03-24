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
        card.limits = {};
        card.updateReceiveAmount = updateReceiveAmount;
        card.updateLimitsAndReceiveAmount = updateLimitsAndReceiveAmount;
        card.redirectToMerchant = redirectToMerchant;

        reset();

        $scope.$on(events.WALLET_CARD_DEPOSIT, function (event, eventData) {
            dialogService.open('#card-deposit-dialog');

            reset();
            card.crypto = eventData.currency;

            updateLimitsAndReceiveAmount();
        });

        function reset() {
            card.payAmount = DEFAULT_AMOUNT_TO_PAY;
            card.payCurrency = card.currencies[0];
            card.crypto = {};
        }

        function updateLimitsAndReceiveAmount() {
            fiatService.getLimits(applicationContext.account.address, card.payCurrency.code, card.crypto)
                .then(function (response) {
                    card.limits = {
                        min: Number(response.min),
                        max: Number(response.max)
                    };
                }).catch(function (response) {
                    remotePartyErrorHandler('get limits', response);
                });

            updateReceiveAmount();
        }

        function remotePartyErrorHandler(operationName, response) {
            if (response) {
                if (response.data)
                    notificationService.error(response.data.message);
                else if (response.statusText)
                    notificationService.error('Failed to ' + operationName + '. Error code: ' + response.status +
                        '<br/>Message: ' + response.statusText);
            }
            else {
                notificationService.error('Operation failed: ' + operationName);
            }
        }

        function updateReceiveAmount() {
            if (deferred) {
                deferred.reject();
                deferred = undefined;
            }

            var amount = Number(card.payAmount);
            if (isNaN(amount) || card.payAmount <= 0) {
                card.getAmount = '';

                return;
            }

            deferred = $q.defer();
            deferred.promise.then(function (response) {
                if (response) {
                    card.getAmount = response + ' ' + card.crypto.shortName;
                }
                else {
                    card.getAmount = '';
                }
            }).catch(function (value) {
                if (value)
                    remotePartyErrorHandler('get rates', value);
            });

            fiatService.getRate(applicationContext.account.address, card.payAmount, card.payCurrency.code, card.crypto)
                .then(deferred.resolve).catch(deferred.reject);
        }

        function redirectToMerchant() {
            try {
                validateAmountToPay();

                var url = fiatService.getMerchantUrl(applicationContext.account.address,
                    card.payAmount, card.payCurrency.code, card.crypto);
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
