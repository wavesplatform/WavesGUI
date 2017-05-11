(function () {
    'use strict';

    var FIXED_REISSUE_FEE = new Money(1, Currency.WAVES);

    function WavesAssetReissueController($scope, $timeout, constants, events, applicationContext, assetService,
                                         dialogService, notificationService, formattingService, apiService,
                                         transactionBroadcast) {
        var reissue = this;
        reissue.confirm = {};
        reissue.broadcast = new transactionBroadcast.instance(apiService.assets.reissue,
            function (transaction, response) {
                var amount = Money.fromCoins(transaction.quantity, reissue.asset.currency);
                var displayMessage = 'Reissued ' + amount.formatAmount(true) + ' tokens of asset ' +
                    reissue.asset.currency.displayName + '<br/>Date: ' +
                    formattingService.formatTimestamp(transaction.timestamp);
                notificationService.notice(displayMessage);
            });
        reissue.fee = FIXED_REISSUE_FEE;
        reissue.validationOptions = {
            rules: {
                assetAmount: {
                    required: true,
                    decimal: 0,
                    min: 0
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
            if (!asset)
                throw new Error('Failed to find asset data by id ' + eventData.assetId);

            resetReissueForm();

            reissue.assetId = eventData.assetId;
            reissue.assetName = asset.currency.displayName;
            reissue.totalTokens = asset.totalTokens;
            reissue.asset = asset;
            reissue.wavesBalance = eventData.wavesBalance;

            // update validation options and check how it affects form validation
            reissue.validationOptions.rules.assetAmount.decimal = asset.currency.precision;
            var minimumPayment = Money.fromCoins(1, asset.currency);
            var maximumPayment = Money.fromCoins(constants.JAVA_MAX_LONG, asset.currency);
            reissue.validationOptions.rules.assetAmount.min = minimumPayment.toTokens();
            reissue.validationOptions.rules.assetAmount.max = maximumPayment.toTokens();
            reissue.validationOptions.messages.assetAmount.decimal = 'The amount to reissue must be a number ' +
                'with no more than ' + minimumPayment.currency.precision +
                ' digits after the decimal point (.)';
            reissue.validationOptions.messages.assetAmount.min = 'Amount to reissue is too small. ' +
                'It should be greater or equal to ' + minimumPayment.formatAmount(false);
            reissue.validationOptions.messages.assetAmount.max = 'Amount to reissue is too big. ' +
                'It should be less or equal to ' + maximumPayment.formatAmount(false);

            dialogService.open('#asset-reissue-dialog');
        });

        function submitReissue (form) {
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
            reissue.broadcast.setTransaction(assetService.createAssetReissueTransaction(assetReissue, sender));

            // setting data for the confirmation dialog
            reissue.confirm.amount = assetReissue.totalTokens;
            reissue.confirm.fee = assetReissue.fee;

            // open confirmation dialog
            // doing it async because this method is called while another dialog is open
            $timeout(function () {
                dialogService.open('#asset-reissue-confirm-dialog');
            }, 1);

            // it's ok to close reissue dialog
            return true;
        }

        function broadcastTransaction () {
            reissue.broadcast.broadcast();
        }

        function resetReissueForm() {
            reissue.amount = '0';
            reissue.confirm.amount = Money.fromTokens(0, Currency.WAVES);
            reissue.confirm.fee = reissue.fee;
        }
    }

    WavesAssetReissueController.$inject = ['$scope', '$timeout', 'constants.ui', 'portfolio.events',
        'applicationContext', 'assetService', 'dialogService', 'notificationService',
        'formattingService', 'apiService', 'transactionBroadcast'];

    angular
        .module('app.portfolio')
        .controller('assetReissueController', WavesAssetReissueController);
})();
