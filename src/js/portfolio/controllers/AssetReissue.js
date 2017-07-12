(function () {
    'use strict';

    const FIXED_REISSUE_FEE = new Money(1, Currency.WAVES);

    function AssetReissue($scope, $timeout, constants, events, applicationContext, assetService, dialogService,
                          notificationService, formattingService, apiService, transactionBroadcast) {

        const ctrl = this;

        ctrl.confirm = {};

        ctrl.broadcast = new transactionBroadcast.instance(apiService.assets.reissue,
            ((transaction) => {
                const amount = Money.fromCoins(transaction.quantity, ctrl.asset.currency);
                const displayMessage = `Reissued ${amount.formatAmount(true)} tokens of asset ${
                    ctrl.asset.currency.displayName}<br/>Date: ${
                    formattingService.formatTimestamp(transaction.timestamp)}`;
                notificationService.notice(displayMessage);
            }));

        ctrl.fee = FIXED_REISSUE_FEE;

        ctrl.validationOptions = {
            rules: {
                assetAmount: {
                    required: true,
                    decimal: 0,
                    min: 0
                }
            },
            messages: {
                assetAmount: {
                    required: `Amount to reissue is required`
                }
            }
        };

        ctrl.submitReissue = submitReissue;
        ctrl.broadcastTransaction = broadcastTransaction;

        resetReissueForm();

        $scope.$on(events.ASSET_REISSUE, (event, eventData) => {
            const asset = applicationContext.cache.assets[eventData.assetId];
            if (!asset) {
                throw new Error(`Failed to find asset data by id ${eventData.assetId}`);
            }

            resetReissueForm();

            ctrl.assetId = eventData.assetId;
            ctrl.assetName = asset.currency.displayName;
            ctrl.totalTokens = asset.totalTokens;
            ctrl.asset = asset;
            ctrl.wavesBalance = eventData.wavesBalance;

            // update validation options and check how it affects form validation
            ctrl.validationOptions.rules.assetAmount.decimal = asset.currency.precision;
            const minimumPayment = Money.fromCoins(1, asset.currency);
            const maximumPayment = Money.fromCoins(constants.JAVA_MAX_LONG, asset.currency);
            ctrl.validationOptions.rules.assetAmount.min = minimumPayment.toTokens();
            ctrl.validationOptions.rules.assetAmount.max = maximumPayment.toTokens();
            ctrl.validationOptions.messages.assetAmount.decimal = `${`The amount to reissue must be a number ` +
                `with no more than `}${minimumPayment.currency.precision
            } digits after the decimal point (.)`;
            ctrl.validationOptions.messages.assetAmount.min = `${`Amount to reissue is too small. ` +
                `It should be greater or equal to `}${minimumPayment.formatAmount(false)}`;
            ctrl.validationOptions.messages.assetAmount.max = `${`Amount to reissue is too big. ` +
                `It should be less or equal to `}${maximumPayment.formatAmount(false)}`;

            dialogService.open(`#asset-reissue-dialog`);
        });

        function submitReissue(form) {
            if (!form.validate(ctrl.validationOptions)) {
                // prevent dialog from closing
                return false;
            }

            if (ctrl.fee.greaterThan(ctrl.wavesBalance)) {
                notificationService.error(`Not enough funds for the reissue transaction fee`);

                return false;
            }

            const assetReissue = {
                totalTokens: Money.fromTokens(ctrl.amount, ctrl.asset.currency),
                reissuable: ctrl.reissuable,
                fee: ctrl.fee
            };

            const sender = {
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            };
            // creating the transaction and waiting for confirmation
            ctrl.broadcast.setTransaction(assetService.createAssetReissueTransaction(assetReissue, sender));

            // setting data for the confirmation dialog
            ctrl.confirm.amount = assetReissue.totalTokens;
            ctrl.confirm.fee = assetReissue.fee;

            // open confirmation dialog
            // doing it async because this method is called while another dialog is open
            $timeout(() => {
                dialogService.open(`#asset-reissue-confirm-dialog`);
            }, 1);

            // it's ok to close reissue dialog
            return true;
        }

        function broadcastTransaction() {
            ctrl.broadcast.broadcast();
        }

        function resetReissueForm() {
            ctrl.amount = `0`;
            ctrl.confirm.amount = Money.fromTokens(0, Currency.WAVES);
            ctrl.confirm.fee = ctrl.fee;
        }
    }

    AssetReissue.$inject = [
        `$scope`, `$timeout`, `constants.ui`, `portfolio.events`, `applicationContext`, `assetService`, `dialogService`,
        `notificationService`, `formattingService`, `apiService`, `transactionBroadcast`
    ];

    angular
        .module(`app.portfolio`)
        .controller(`assetReissueController`, AssetReissue);
})();
