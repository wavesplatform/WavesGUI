(function () {
    'use strict';

    var DEFAULT_FEE_AMOUNT = '0.001';

    function WavesWalletSendController ($scope, $timeout, constants, events, autocomplete,
                                        applicationContext, apiService, dialogService,
                                        transactionBroadcast, assetService, notificationService,
                                        formattingService, addressService) {
        var send = this;
        var minimumFee = new Money(constants.MINIMUM_TRANSACTION_FEE, Currency.WAV);

        send.autocomplete = autocomplete;
        send.validationOptions = {
            rules: {
                sendRecipient: {
                    required: true,
                    address: true
                },
                sendAmount: {
                    required: true,
                    decimal: 8, // stub value updated on validation
                    min: 0,     // stub value updated on validation
                    max: constants.JAVA_MAX_LONG // stub value updated on validation
                },
                sendFee: {
                    required: true,
                    decimal: Currency.WAV.precision,
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
                    decimal: 'Transaction fee must be with no more than ' +
                        minimumFee.currency.precision + ' digits after the decimal point (.)',
                    min: 'Transaction fee is too small. It should be greater or equal to ' +
                        minimumFee.formatAmount(true)
                },
                sendAttachment: {
                    maxbytelength: 'Attachment is too long'
                }
            }
        };
        send.confirm = {
            amount: {
                value: '0',
                currency: ''
            },
            fee: {
                value: '0',
                currency: ''
            },
            recipient: ''
        };
        send.broadcast = new transactionBroadcast.instance(apiService.assets.transfer,
            function (transaction, response) {
                var amount = Money.fromCoins(transaction.amount, send.assetBalance.currency);
                var address = transaction.recipient;
                var displayMessage = 'Sent ' + amount.formatAmount(true) + ' of ' +
                    send.assetBalance.currency.displayName +
                    '<br/>Recipient ' + address.substr(0,15) + '...<br/>Date: ' +
                    formattingService.formatTimestamp(transaction.timestamp);
                notificationService.notice(displayMessage);
            });
        send.submitTransfer = submitTransfer;
        send.broadcastTransaction = broadcastTransaction;
        send.getForm = getForm;

        $scope.$on(events.WALLET_SEND, function (event, eventData) {
            send.wavesBalance = eventData.wavesBalance;
            send.assetBalance = eventData.assetBalance;
            send.sendingWaves = eventData.assetBalance.currency === Currency.WAV;
            send.currency = eventData.assetBalance.currency.displayName;

            // update validation options and check how it affects form validation
            send.validationOptions.rules.sendAmount.decimal = send.assetBalance.currency.precision;
            var minimumPayment = Money.fromCoins(1, send.assetBalance.currency);
            send.validationOptions.rules.sendAmount.min = minimumPayment.toTokens();
            send.validationOptions.rules.sendAmount.max = send.assetBalance.toTokens();
            send.validationOptions.messages.sendAmount.decimal = 'The amount to send must be a number ' +
                'with no more than ' + minimumPayment.currency.precision +
                ' digits after the decimal point (.)';
            send.validationOptions.messages.sendAmount.min = 'Payment amount is too small. ' +
                'It should be greater or equal to ' + minimumPayment.formatAmount(false);
            send.validationOptions.messages.sendAmount.max = 'Payment amount is too big. ' +
                'It should be less or equal to ' + send.assetBalance.formatAmount(false);

            dialogService.open('#wB-butSend-WAV');
        });

        resetForm();

        function submitTransfer() {
            var transferForm = send.getForm();
            var invalid = transferForm.invalid();
            send.fee.isValid = angular.isDefined(invalid.sendFee) ?
                !invalid.sendFee : true;
            if (!transferForm.validate(send.validationOptions))
                // prevent dialog from closing
                return false;

            var amount = Money.fromTokens(send.amount, send.assetBalance.currency);
            var transferFee = Money.fromTokens(send.autocomplete.getFeeAmount(), Currency.WAV);
            var paymentCost = transferFee;
            if (send.sendingWaves)
                paymentCost = paymentCost.plus(amount);

            if (paymentCost.greaterThan(send.wavesBalance)) {
                notificationService.error('Not enough Waves for the transfer');

                return false;
            }

            var assetTransfer = {
                recipient: addressService.cleanupOptionalPrefix(send.recipient),
                amount: amount,
                fee: transferFee
            };

            if (send.attachment)
                assetTransfer.attachment = converters.stringToByteArray(send.attachment);

            var sender = {
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            };
            // creating the transaction and waiting for confirmation
            send.broadcast.setTransaction(assetService.createAssetTransferTransaction(assetTransfer, sender));

            // setting data for the confirmation dialog
            send.confirm.amount.value = assetTransfer.amount.formatAmount(true);
            send.confirm.amount.currency = assetTransfer.amount.currency.displayName;
            send.confirm.fee.value = assetTransfer.fee.formatAmount(true);
            send.confirm.fee.currency = assetTransfer.fee.currency.displayName;
            send.confirm.recipient = assetTransfer.recipient;

            // open confirmation dialog
            // doing it async because this method is called while another dialog is open
            $timeout(function () {
                dialogService.open('#send-payment-confirmation');
            }, 1);

            resetForm();

            // it's ok to close payment dialog
            return true;
        }

        function broadcastTransaction() {
            send.broadcast.broadcast();
        }

        function getForm() {
            // here we have a direct markup dependency
            // but other ways of getting the form from a child scope are even more ugly
            return angular.element('#send-waves-form').scope().sendWavesForm;
        }

        function resetForm() {
            send.recipient = '';
            send.amount = '0';
            send.fee = {
                amount: DEFAULT_FEE_AMOUNT,
                isValid: true
            };

            send.autocomplete.defaultFee(Number(DEFAULT_FEE_AMOUNT));
        }
    }

    WavesWalletSendController.$inject = ['$scope', '$timeout', 'constants.ui', 'wallet.events', 'autocomplete.fees',
        'applicationContext', 'apiService', 'dialogService', 'transactionBroadcast', 'assetService',
        'notificationService', 'formattingService', 'addressService'];

    angular
        .module('app.wallet')
        .controller('walletSendController', WavesWalletSendController);
})();
