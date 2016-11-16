(function () {
    'use strict';

    function WavesAssetTransferController($scope, $timeout, constants, events, autocomplete, applicationContext,
                                          assetService, apiService, dialogService,
                                          formattingService, notificationService) {
        var transaction;
        var transfer = this;
        var minimumFee = new Money(constants.MINIMUM_TRANSACTION_FEE, Currency.WAV);

        transfer.availableBalance = 0;
        transfer.confirm = {
            amount: {
                value: '0',
                currency: ''
            },
            fee: {
                value: '0',
                currency: ''
            },
            recipient: '',
            pendingTransfer: false
        };
        transfer.autocomplete = autocomplete;
        transfer.validationOptions = {
            rules: {
                assetRecipient: {
                    required: true,
                    address: true
                },
                assetAmount: {
                    required: true,
                    decimal: 0,
                    min: 1
                },
                assetFee: {
                    required: true,
                    decimal: Currency.WAV.precision,
                    min: minimumFee.toTokens()
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
                }
            }
        };
        transfer.submitTransfer = submitTransfer;
        transfer.broadcastTransaction = broadcastTransaction;

        resetPaymentForm();

        $scope.$on(events.ASSET_TRANSFER, function (event, assetId) {
            var asset = applicationContext.cache.assets[assetId];
            transfer.availableBalance = asset.balance.formatAmount();
            transfer.asset = asset;

            // update validation options and check how it affects form validation
            transfer.validationOptions.rules.assetAmount.decimal = asset.currency.precision;
            var minimumPayment = Money.fromCoins(1, asset.currency);
            transfer.validationOptions.rules.assetAmount.min = minimumPayment.toTokens();
            transfer.validationOptions.messages.assetAmount.decimal = 'The amount to send must be a number ' +
                'with no more than ' + minimumPayment.currency.precision +
                ' digits after the decimal point (.)';
            transfer.validationOptions.messages.assetAmount.min = 'Payment amount is too small. ' +
                'It should be greater or equal to ' + minimumPayment.formatAmount(false);

            dialogService.open('#asset-transfer-dialog');
        });

        function getTransferForm() {
            // here we have a direct markup dependency
            // but other ways of getting the form from a child scope are even more ugly
            return angular.element('#transfer-asset-form').scope().transferAssetForm;
        }

        function submitTransfer() {
            var transferForm = getTransferForm();
            var invalid = transferForm.invalid();
            transfer.fee.isValid = angular.isDefined(invalid.assetFee) ?
                !invalid.assetFee : true;
            if (!transferForm.validate(transfer.validationOptions))
                // prevent dialog from closing
                return false;

            var assetTransfer = {
                recipient: transfer.recipient,
                amount: Money.fromTokens(transfer.amount, transfer.asset.currency),
                fee: Money.fromTokens(transfer.autocomplete.getFeeAmount(), Currency.WAV)
            };
            var sender = {
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            };
            // creating the transaction and waiting for confirmation
            transaction = assetService.createAssetTransferTransaction(assetTransfer, sender);

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
            // checking if transaction was saved
            if (angular.isUndefined(transaction))
                return;

            // prevent method execution when there is a pending transfer request
            if (transfer.confirm.paymentPending)
                return;

            //disable confirm button
            transfer.confirm.paymentPending = true;

            apiService.assets.transfer(transaction).then(function () {
                var amount = Money.fromCoins(transaction.amount, transfer.asset);
                var address = transaction.recipient;
                var displayMessage = 'Sent ' + amount.formatAmount(true) + ' of ' +
                    transfer.asset.currency.displayName +
                    '<br/>Recipient ' + address.substr(0,15) + '...<br/>Date: ' +
                    formattingService.formatTimestamp(transaction.timestamp);
                notificationService.notice(displayMessage);
                //enable confirm button
                transfer.confirm.paymentPending = false;
                transaction = undefined;
            }, function (response) {
                if (angular.isDefined(response.data))
                    notificationService.error('Error:' + response.data.error + ' - ' + response.data.message);
                else
                    notificationService.error('Request failed. Status: ' + response.status + ' - ' +
                        response.statusText);
                //enable confirm button
                transfer.confirm.paymentPending = false;
                transaction = undefined;
            });
        }

        function resetPaymentForm() {
            transfer.recipient = '';
            transfer.amount = '0';
            transfer.fee = {
                amount: '0.001',
                isValid: true
            };
        }
    }

    WavesAssetTransferController.$inject = ['$scope', '$timeout', 'constants.ui', 'portfolio.events',
        'autocomplete.fees', 'applicationContext', 'assetService', 'apiService', 'dialogService',
        'formattingService', 'notificationService'];

    angular
        .module('app.portfolio')
        .controller('assetTransferController', WavesAssetTransferController);
})();
