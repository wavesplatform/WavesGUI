(function () {
    'use strict';

    var FEE_CURRENCY = Currency.WAVES;

    function AssetTransferController($scope, $timeout, constants, events, autocomplete, applicationContext,
                                     assetService, apiService, dialogService, formattingService,
                                     notificationService, transactionBroadcast, addressService) {
        var ctrl = this;
        var minimumFee = new Money(constants.MINIMUM_TRANSACTION_FEE, FEE_CURRENCY);

        ctrl.availableBalance = 0;
        ctrl.feeAssetBalance = 0;

        ctrl.confirm = {
            recipient: ''
        };

        ctrl.broadcast = new transactionBroadcast.instance(apiService.assets.transfer,
            function (transaction) {
                var amount = Money.fromCoins(transaction.amount, ctrl.asset.currency);
                var address = transaction.recipient;
                var displayMessage = 'Sent ' + amount.formatAmount(true) + ' of ' +
                    ctrl.asset.currency.displayName +
                    '<br/>Recipient ' + address.substr(0,15) + '...<br/>Date: ' +
                    formattingService.formatTimestamp(transaction.timestamp);
                notificationService.notice(displayMessage);
            }
        );

        ctrl.autocomplete = autocomplete;

        ctrl.validationOptions = {
            rules: {
                assetRecipient: {
                    required: true
                },
                assetAmount: {
                    required: true,
                    decimal: 8, // stub value updated on validation
                    min: 0,     // stub value updated on validation
                    max: constants.JAVA_MAX_LONG // stub value updated on validation
                },
                assetFee: {
                    required: true,
                    decimal: Currency.WAVES.precision,
                    min: minimumFee.toTokens()
                },
                assetAttachment: {
                    maxbytelength: constants.MAXIMUM_ATTACHMENT_BYTE_SIZE
                }
            },
            messages: {
                assetRecipient: {
                    required: 'Recipient account number is required'
                },
                assetAmount: {
                    required: 'Amount to send is required'
                },
                assetFee: {
                    required: 'Transaction fee is required',
                    decimal: 'Transaction fee must be with no more than ' +
                        minimumFee.currency.precision + ' digits after the decimal point (.)',
                    min: 'Transaction fee is too small. It should be greater or equal to ' +
                        minimumFee.formatAmount(true)
                },
                maxbytelength: {
                    maxbytelength: 'Attachment is too long'
                }
            }
        };

        ctrl.submitTransfer = submitTransfer;
        ctrl.broadcastTransaction = broadcastTransaction;

        resetPaymentForm();

        $scope.$on(events.ASSET_TRANSFER, function (event, eventData) {
            var asset = applicationContext.cache.assets[eventData.assetId];
            ctrl.availableBalance = asset.balance;
            ctrl.feeAssetBalance = eventData.wavesBalance;
            ctrl.asset = asset;

            resetPaymentForm();

            // Update validation options and check how they affect form validation
            ctrl.validationOptions.rules.assetAmount.decimal = asset.currency.precision;
            var minimumPayment = Money.fromCoins(1, asset.currency);
            ctrl.validationOptions.rules.assetAmount.min = minimumPayment.toTokens();
            ctrl.validationOptions.rules.assetAmount.max = ctrl.availableBalance.toTokens();
            ctrl.validationOptions.messages.assetAmount.decimal = 'The amount to send must be a number ' +
                'with no more than ' + minimumPayment.currency.precision +
                ' digits after the decimal point (.)';
            ctrl.validationOptions.messages.assetAmount.min = 'Payment amount is too small. ' +
                'It should be greater or equal to ' + minimumPayment.formatAmount(false);
            ctrl.validationOptions.messages.assetAmount.max = 'Payment amount is too big. ' +
                'It should be less or equal to ' + ctrl.availableBalance.formatAmount(false);

            dialogService.open('#asset-transfer-dialog');
        });

        function submitTransfer(transferForm) {
            if (!transferForm.validate(ctrl.validationOptions)) {
                // Prevent dialog from closing
                return false;
            }

            var transferFee = Money.fromTokens(ctrl.autocomplete.getFeeAmount(), FEE_CURRENCY);
            if (transferFee.greaterThan(ctrl.feeAssetBalance)) {
                notificationService.error('Not enough funds for the transfer transaction fee');
                return false;
            }

            var transferAmount = Money.fromTokens(ctrl.amount, ctrl.asset.currency);
            if (transferAmount.greaterThan(ctrl.availableBalance)) {
                notificationService.error('Transfer amount exceeds available asset balance');
                return false;
            }

            var assetTransfer = {
                recipient: addressService.cleanupOptionalPrefix(ctrl.recipient),
                amount: transferAmount,
                fee: transferFee
            };

            if (ctrl.attachment) {
                assetTransfer.attachment = converters.stringToByteArray(ctrl.attachment);
            }

            var sender = {
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            };

            // Create a transaction and wait for confirmation
            ctrl.broadcast.setTransaction(assetService.createAssetTransferTransaction(assetTransfer, sender));

            // Set data to the confirmation dialog
            ctrl.confirm.amount = assetTransfer.amount;
            ctrl.confirm.fee = assetTransfer.fee;
            ctrl.confirm.recipient = assetTransfer.recipient;

            // Open confirmation dialog (async because this method is called while another dialog is open)
            $timeout(function () {
                dialogService.open('#transfer-asset-confirmation');
            }, 1);

            // Close payment dialog
            return true;
        }

        function broadcastTransaction() {
            ctrl.broadcast.broadcast();
        }

        function resetPaymentForm() {
            ctrl.recipient = '';
            ctrl.amount = '0';
            ctrl.confirm.amount = Money.fromTokens(0, Currency.WAVES);
            ctrl.confirm.fee = Money.fromTokens(constants.MINIMUM_TRANSACTION_FEE, FEE_CURRENCY);
            ctrl.autocomplete.defaultFee(constants.MINIMUM_TRANSACTION_FEE);
        }
    }

    AssetTransferController.$inject = ['$scope', '$timeout', 'constants.ui', 'portfolio.events',
        'autocomplete.fees', 'applicationContext', 'assetService', 'apiService', 'dialogService',
        'formattingService', 'notificationService', 'transactionBroadcast', 'addressService'];

    angular
        .module('app.portfolio')
        .controller('assetTransferController', AssetTransferController);
})();
