(function () {
    'use strict';

    var FIXED_REISSUE_FEE = new Money(1, Currency.WAV);

    function WavesAssetReissueController($scope, $timeout, events, applicationContext, assetService, dialogService,
                                         notificationService, formattingService, apiService) {
        var transaction;
        var reissue = this;
        reissue.confirm = {
            amount: {},
            fee: {},
            reissuePending: false
        };
        reissue.fee = FIXED_REISSUE_FEE;
        reissue.validationOptions = {
            rules: {
                assetAmount: {
                    required: true,
                    decimal: 0,
                    min: 1
                }
            },
            messages: {
                assetAmount: {
                    required: 'Amount to reissue is required'
                }
            }
        };
        reissue.submitReissue = submitReissue;
        reissue.broadcastTransaction = broadcastTransaction;

        resetReissueForm();

        $scope.$on(events.ASSET_REISSUE, function (event, eventData) {
            var asset = applicationContext.cache.assets[eventData.assetId];
            if (angular.isUndefined(asset))
                throw new Error('Failed to find asset data by id ' + eventData.assetId);

            reissue.assetId = eventData.assetId;
            reissue.assetName = asset.currency.displayName;
            reissue.totalTokens = asset.totalTokens;
            reissue.asset = asset;
            reissue.wavesBalance = eventData.wavesBalance;

            // update validation options and check how it affects form validation
            reissue.validationOptions.rules.assetAmount.decimal = asset.currency.precision;
            var minimumPayment = Money.fromCoins(1, asset.currency);
            reissue.validationOptions.rules.assetAmount.min = minimumPayment.toTokens();
            reissue.validationOptions.messages.assetAmount.decimal = 'The amount to reissue must be a number ' +
                'with no more than ' + minimumPayment.currency.precision +
                ' digits after the decimal point (.)';
            reissue.validationOptions.messages.assetAmount.min = 'Amount to reissue is too small. ' +
                'It should be greater or equal to ' + minimumPayment.formatAmount(false);

            dialogService.open('#asset-reissue-dialog');
        });

        function submitReissue () {
            var form = getReissueForm();
            if (!form.validate(reissue.validationOptions))
                // prevent dialog from closing
                return false;

            if (reissue.fee.greaterThan(reissue.wavesBalance)) {
                notificationService.error('Not enough funds for the reissue transaction fee');

                return false;
            }

            var assetReissue = {
                totalTokens: Money.fromTokens(reissue.amount, reissue.asset.currency),
                reissuable: reissue.reissuable,
                fee: reissue.fee
            };

            var sender = {
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            };
            // creating the transaction and waiting for confirmation
            transaction = assetService.createAssetReissueTransaction(assetReissue, sender);

            // setting data for the confirmation dialog
            reissue.confirm.amount.value = assetReissue.totalTokens.formatAmount(true);
            reissue.confirm.amount.currency = assetReissue.totalTokens.currency.displayName;
            reissue.confirm.fee.value = assetReissue.fee.formatAmount(true);
            reissue.confirm.fee.currency = assetReissue.fee.currency.displayName;

            // open confirmation dialog
            // doing it async because this method is called while another dialog is open
            $timeout(function () {
                dialogService.open('#asset-reissue-confirm-dialog');
            }, 1);

            resetReissueForm();

            // it's ok to close reissue dialog
            return true;
        }

        function broadcastTransaction () {
            // checking if transaction was saved
            if (angular.isUndefined(transaction))
                return;

            // prevent method execution when there is a pending reissue request
            if (reissue.confirm.reissuePending)
                return;

            //disable confirm button
            reissue.confirm.reissuePending = true;

            apiService.assets.reissue(transaction).then(function () {
                var amount = Money.fromCoins(transaction.quantity, reissue.asset);
                var displayMessage = 'Reissued ' + amount.formatAmount(true) + ' tokens of asset ' +
                    reissue.asset.currency.displayName + '<br/>Date: ' +
                    formattingService.formatTimestamp(transaction.timestamp);
                notificationService.notice(displayMessage);
                //enable confirm button
                reissue.confirm.reissuePending = false;
                transaction = undefined;
            }, function (response) {
                if (angular.isDefined(response.data))
                    notificationService.error('Error:' + response.data.error + ' - ' + response.data.message);
                else
                    notificationService.error('Request failed. Status: ' + response.status + ' - ' +
                        response.statusText);
                //enable confirm button
                reissue.confirm.reissuePending = false;
                transaction = undefined;
            });
        }

        function getReissueForm() {
            // here we have a direct markup dependency
            // but other ways of getting the form from a child scope are even more ugly
            return angular.element('#asset-reissue-form').scope().assetReissueForm;
        }

        function resetReissueForm() {
            reissue.amount = '0';
        }
    }

    WavesAssetReissueController.$inject = ['$scope', '$timeout', 'portfolio.events', 'applicationContext',
        'assetService', 'dialogService', 'notificationService', 'formattingService', 'apiService'];

    angular
        .module('app.portfolio')
        .controller('assetReissueController', WavesAssetReissueController);
})();
