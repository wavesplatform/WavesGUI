(function () {
    'use strict';

    var DEFAULT_FEE_AMOUNT = '0.001';
    var FEE_CURRENCY = Currency.WAVES;

    function WalletSendController($scope, $timeout, constants, events, autocomplete,
                                  applicationContext, apiService, dialogService,
                                  transactionBroadcast, assetService, notificationService,
                                  formattingService, addressService) {
        var ctrl = this;
        var minimumFee = new Money(constants.MINIMUM_TRANSACTION_FEE, FEE_CURRENCY);

        ctrl.autocomplete = autocomplete;

        ctrl.confirm = {
            recipient: ''
        };

        ctrl.broadcast = new transactionBroadcast.instance(apiService.assets.transfer,
            function (transaction) {
                var amount = Money.fromCoins(transaction.amount, ctrl.assetBalance.currency);
                var address = transaction.recipient;
                var displayMessage = 'Sent ' + amount.formatAmount(true) + ' of ' +
                    ctrl.assetBalance.currency.displayName +
                    '<br/>Recipient ' + address.substr(0,15) + '...<br/>Date: ' +
                    formattingService.formatTimestamp(transaction.timestamp);
                notificationService.notice(displayMessage);
            }
        );

        ctrl.validationOptions = {
            rules: {
                sendRecipient: {
                    required: true
                },
                sendAmount: {
                    required: true,
                    decimal: 8, // stub value updated on validation
                    min: 0,     // stub value updated on validation
                    max: constants.JAVA_MAX_LONG // stub value updated on validation
                },
                sendFee: {
                    required: true,
                    decimal: Currency.WAVES.precision,
                    min: minimumFee.toTokens()
                },
                sendAttachment: {
                    maxbytelength: constants.MAXIMUM_ATTACHMENT_BYTE_SIZE
                }
            },
            messages: {
                sendRecipient: {
                    required: 'Recipient account number is required'
                },
                sendAmount: {
                    required: 'Amount to send is required'
                },
                sendFee: {
                    required: 'Transaction fee is required',
                    decimal: 'Transaction fee must be a number with no more than ' +
                        minimumFee.currency.precision + ' digits after the decimal point (.)',
                    min: 'Transaction fee is too small. It should be greater or equal to ' +
                        minimumFee.formatAmount(true)
                },
                sendAttachment: {
                    maxbytelength: 'Attachment is too long'
                }
            }
        };

        ctrl.submitTransfer = submitTransfer;
        ctrl.broadcastTransaction = broadcastTransaction;

        resetForm();

        $scope.$on(events.WALLET_SEND, function (event, eventData) {

            resetForm();

            ctrl.feeAssetBalance = eventData.wavesBalance;
            ctrl.assetBalance = eventData.assetBalance;
            ctrl.feeAndTransferAssetsAreTheSame = eventData.assetBalance.currency === FEE_CURRENCY;
            ctrl.currency = eventData.assetBalance.currency.displayName;

            // Update validation options and check how they affect form validation
            ctrl.validationOptions.rules.sendAmount.decimal = ctrl.assetBalance.currency.precision;
            var minimumPayment = Money.fromCoins(1, ctrl.assetBalance.currency);
            ctrl.validationOptions.rules.sendAmount.min = minimumPayment.toTokens();
            ctrl.validationOptions.rules.sendAmount.max = ctrl.assetBalance.toTokens();
            ctrl.validationOptions.messages.sendAmount.decimal = 'The amount to send must be a number ' +
                'with no more than ' + minimumPayment.currency.precision +
                ' digits after the decimal point (.)';
            ctrl.validationOptions.messages.sendAmount.min = 'Payment amount is too small. ' +
                'It should be greater or equal to ' + minimumPayment.formatAmount(false);
            ctrl.validationOptions.messages.sendAmount.max = 'Payment amount is too big. ' +
                'It should be less or equal to ' + ctrl.assetBalance.formatAmount(false);

            dialogService.open('#wB-butSend-WAV');
        });

        function submitTransfer(transferForm) {
            if (!transferForm.validate(ctrl.validationOptions)) {
                // Prevent dialog from closing
                return false;
            }

            var amount = Money.fromTokens(ctrl.amount, ctrl.assetBalance.currency);
            var transferFee = Money.fromTokens(ctrl.autocomplete.getFeeAmount(), FEE_CURRENCY);
            var paymentCost = transferFee;

            if (ctrl.feeAndTransferAssetsAreTheSame) {
                paymentCost = paymentCost.plus(amount);
            }

            if (paymentCost.greaterThan(ctrl.feeAssetBalance)) {
                notificationService.error('Not enough ' + FEE_CURRENCY.displayName + ' for the transfer');
                return false;
            }

            var assetTransfer = {
                recipient: addressService.cleanupOptionalPrefix(ctrl.recipient),
                amount: amount,
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
                dialogService.open('#send-payment-confirmation');
            }, 1);

            // Close payment dialog
            return true;
        }

        function broadcastTransaction() {
            ctrl.broadcast.broadcast();
        }

        function resetForm() {
            ctrl.recipient = '';
            ctrl.amount = '0';
            ctrl.confirm.amount = Money.fromTokens(0, Currency.WAVES);
            ctrl.confirm.fee = Money.fromTokens(DEFAULT_FEE_AMOUNT, FEE_CURRENCY);
            ctrl.autocomplete.defaultFee(Number(DEFAULT_FEE_AMOUNT));
        }
    }

    WalletSendController.$inject = ['$scope', '$timeout', 'constants.ui', 'wallet.events', 'autocomplete.fees',
        'applicationContext', 'apiService', 'dialogService', 'transactionBroadcast', 'assetService',
        'notificationService', 'formattingService', 'addressService'];

    angular
        .module('app.wallet')
        .controller('walletSendController', WalletSendController);
})();
