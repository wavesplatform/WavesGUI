(function () {
    'use strict';

    function WavesAssetTransferController($scope, $timeout, constants, events, autocomplete, applicationContext,
                                          assetService, apiService, dialogService,
                                          formattingService, notificationService, transactionBroadcast) {
        var transfer = this;
        var minimumFee = new Money(constants.MINIMUM_TRANSACTION_FEE, Currency.WAV);

        transfer.availableBalance = 0;
        transfer.wavesBalance = 0;
        transfer.confirm = {
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
        transfer.broadcast = new transactionBroadcast.instance(apiService.assets.transfer,
            function (transaction, response) {
                var amount = Money.fromCoins(transaction.amount, transfer.asset.currency);
                var address = transaction.recipient;
                var displayMessage = 'Sent ' + amount.formatAmount(true) + ' of ' +
                    transfer.asset.currency.displayName +
                    '<br/>Recipient ' + address.substr(0,15) + '...<br/>Date: ' +
                    formattingService.formatTimestamp(transaction.timestamp);
                notificationService.notice(displayMessage);
            });
        transfer.autocomplete = autocomplete;
        transfer.validationOptions = {
            rules: {
                assetRecipient: {
                    required: true,
                    address: true
                },
                assetAmount: {
                    required: true,
                    decimal: 8, // stub value updated on validation
                    min: 0,     // stub value updated on validation
                    max: constants.JAVA_MAX_LONG // stub value updated on validation
                },
                assetFee: {
                    required: true,
                    decimal: Currency.WAV.precision,
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
        transfer.submitTransfer = submitTransfer;
        transfer.broadcastTransaction = broadcastTransaction;
        transfer.getForm = getForm;

        resetPaymentForm();

        $scope.$on(events.ASSET_TRANSFER, function (event, eventData) {
            var asset = applicationContext.cache.assets[eventData.assetId];
            transfer.availableBalance = asset.balance;
            transfer.wavesBalance = eventData.wavesBalance;
            transfer.asset = asset;

            // update validation options and check how it affects form validation
            transfer.validationOptions.rules.assetAmount.decimal = asset.currency.precision;
            var minimumPayment = Money.fromCoins(1, asset.currency);
            transfer.validationOptions.rules.assetAmount.min = minimumPayment.toTokens();
            transfer.validationOptions.rules.assetAmount.max = transfer.availableBalance.toTokens();
            transfer.validationOptions.messages.assetAmount.decimal = 'The amount to send must be a number ' +
                'with no more than ' + minimumPayment.currency.precision +
                ' digits after the decimal point (.)';
            transfer.validationOptions.messages.assetAmount.min = 'Payment amount is too small. ' +
                'It should be greater or equal to ' + minimumPayment.formatAmount(false);
            transfer.validationOptions.messages.assetAmount.max = 'Payment amount is too big. ' +
                'It should be less or equal to ' + transfer.availableBalance.formatAmount(false);

            dialogService.open('#asset-transfer-dialog');
        });

        function getForm() {
            // here we have a direct markup dependency
            // but other ways of getting the form from a child scope are even more ugly
            return angular.element('#transfer-asset-form').scope().transferAssetForm;
        }

        function submitTransfer() {
            var transferForm = transfer.getForm();
            var invalid = transferForm.invalid();
            transfer.fee.isValid = angular.isDefined(invalid.assetFee) ?
                !invalid.assetFee : true;
            if (!transferForm.validate(transfer.validationOptions))
                // prevent dialog from closing
                return false;

            var transferFee = Money.fromTokens(transfer.autocomplete.getFeeAmount(), Currency.WAV);
            if (transferFee.greaterThan(transfer.wavesBalance)) {
                notificationService.error('Not enough funds for the transfer transaction fee');

                return false;
            }

            var transferAmount = Money.fromTokens(transfer.amount, transfer.asset.currency);
            if (transferAmount.greaterThan(transfer.availableBalance)) {
                notificationService.error('Transfer amount exceeds available asset balance');

                return false;
            }

            var assetTransfer = {
                recipient: transfer.recipient,
                amount: transferAmount,
                fee: transferFee
            };

            if (transfer.attachment) {
                assetTransfer.attachment = converters.stringToByteArray(transfer.attachment);
            }

            var sender = {
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            };
            // creating the transaction and waiting for confirmation
            transfer.broadcast.setTransaction(assetService.createAssetTransferTransaction(assetTransfer, sender));

            // setting data for the confirmation dialog
            transfer.confirm.amount.value = assetTransfer.amount.formatAmount(true);
            transfer.confirm.amount.currency = assetTransfer.amount.currency.displayName;
            transfer.confirm.fee.value = assetTransfer.fee.formatAmount(true);
            transfer.confirm.fee.currency = assetTransfer.fee.currency.displayName;
            transfer.confirm.recipient = assetTransfer.recipient;

            // open confirmation dialog
            // doing it async because this method is called while another dialog is open
            $timeout(function () {
                dialogService.open('#transfer-asset-confirmation');
            }, 1);

            resetPaymentForm();

            // it's ok to close payment dialog
            return true;
        }

        function broadcastTransaction() {
            transfer.broadcast.broadcast();
        }

        function resetPaymentForm() {
            transfer.recipient = '';
            transfer.amount = '0';
            transfer.fee = {
                amount: constants.MINIMUM_TRANSACTION_FEE.toString(),
                isValid: true
            };
            transfer.autocomplete.defaultFee(constants.MINIMUM_TRANSACTION_FEE);
        }
    }

    WavesAssetTransferController.$inject = ['$scope', '$timeout', 'constants.ui', 'portfolio.events',
        'autocomplete.fees', 'applicationContext', 'assetService', 'apiService', 'dialogService',
        'formattingService', 'notificationService', 'transactionBroadcast'];

    angular
        .module('app.portfolio')
        .controller('assetTransferController', WavesAssetTransferController);
})();
