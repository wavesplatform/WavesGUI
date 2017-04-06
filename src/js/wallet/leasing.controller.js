(function () {
    'use strict';

    var DEFAULT_FEE_AMOUNT = '0.001';
    var FEE_CURRENCY = Currency.WAV;

    function WavesLeasingController ($scope, $timeout, constants, events, autocomplete, applicationContext,
                                     apiService, dialogService, notificationService, transactionBroadcast,
                                     formattingService, addressService) {
        var minimumFee = new Money(constants.MINIMUM_TRANSACTION_FEE, FEE_CURRENCY);

        var leasing = this;
        leasing.autocomplete = autocomplete;
        leasing.availableBalance = Money.fromCoins(0, Currency.WAV);
        leasing.broadcast = new transactionBroadcast.instance(apiService.leasing.lease,
            function (transaction, response) {
                var amount = Money.fromCoins(transaction.amount, Currency.WAV);
                var address = transaction.recipient;
                var displayMessage = 'Leased ' + amount.formatAmount(true) + ' of ' +
                    amount.currency.displayName +
                    '<br/>Recipient ' + address.substr(0,15) + '...<br/>Date: ' +
                    formattingService.formatTimestamp(transaction.timestamp);
                notificationService.notice(displayMessage);
            });
        leasing.validationOptions = {
            rules: {
                leasingRecipient: {
                    required: true,
                    address: true
                },
                leasingAmount: {
                    required: true,
                    decimal: 8, // stub value updated on validation
                    min: 0, // stub value updated on validation
                    max: constants.JAVA_MAX_LONG // stub value updated on validation
                },
                leasingFee: {
                    required: true,
                    decimal: Currency.WAV.precision,
                    min: minimumFee.toTokens()
                }
            },
            messages: {
                leasingRecipient: {
                    required: 'Recipient account number is required'
                },
                leasingAmount: {
                    required: 'Amount to lease is required'
                },
                leasingFee: {
                    required: 'Transaction fee is required',
                    decimal: 'Transaction fee must be with no more than ' +
                        minimumFee.currency.precision + ' digits after the decimal point (.)',
                    min: 'Transaction fee is too small. It should be greater or equal to ' +
                        minimumFee.formatAmount(true)
                }
            }
        };
        leasing.confirm = {
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
        leasing.confirmLease = confirmLease;
        leasing.broadcastTransaction = broadcastTransaction;

        reset();

        $scope.$on(events.WALLET_LEASE, function (event, eventData) {
            //FIXME: add here a correct value available to lease
            leasing.availableBalance = eventData.balanceDetails.effective;

            reset();

            // update validation options and check how it affects form validation
            leasing.validationOptions.rules.leasingAmount.decimal = leasing.availableBalance.currency.precision;
            var minimumPayment = Money.fromCoins(1, leasing.availableBalance.currency);
            leasing.validationOptions.rules.leasingAmount.min = minimumPayment.toTokens();
            leasing.validationOptions.rules.leasingAmount.max = leasing.availableBalance.toTokens();
            leasing.validationOptions.messages.leasingAmount.decimal = 'The amount to leasing must be a number ' +
                'with no more than ' + minimumPayment.currency.precision +
                ' digits after the decimal point (.)';
            leasing.validationOptions.messages.leasingAmount.min = 'Leasing amount is too small. ' +
                'It should be greater or equal to ' + minimumPayment.formatAmount(false);
            leasing.validationOptions.messages.leasingAmount.max = 'Leasing amount is too big. ' +
                'It should be less or equal to ' + leasing.availableBalance.formatAmount(false);

            $timeout(function () {
                dialogService.open('#start-leasing-dialog');
            }, 1);
        });

        function confirmLease(form) {
            if (!form.validate(leasing.validationOptions))
                return false;

            var amount = Money.fromTokens(leasing.amount, leasing.availableBalance.currency);
            var transferFee = Money.fromTokens(leasing.autocomplete.getFeeAmount(), FEE_CURRENCY);

            // we assume here that amount and fee are in Waves, however it's not hardcoded
            var leasingCost = amount.plus(transferFee);
            if (leasingCost.greaterThan(leasing.availableBalance)) {
                notificationService.error('Not enough ' + FEE_CURRENCY.displayName + ' for the leasing transaction');

                return false;
            }

            var leasingObj = {
                recipient: addressService.cleanupOptionalPrefix(leasing.recipient),
                amount: amount,
                fee: transferFee
            };

            var sender = {
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            };

            // creating the transaction and waiting for confirmation
            leasing.broadcast.setTransaction(/*TODO: implement me*/leasingObj);

            // setting data for the confirmation dialog
            leasing.confirm.amount.value = leasingObj.amount.formatAmount(true);
            leasing.confirm.amount.currency = leasingObj.amount.currency.displayName;
            leasing.confirm.fee.value = leasingObj.fee.formatAmount(true);
            leasing.confirm.fee.currency = leasingObj.fee.currency.displayName;
            leasing.confirm.recipient = leasingObj.recipient;

            // open confirmation dialog
            // doing it async because this method is called while another dialog is open
            $timeout(function () {
                dialogService.open('#start-leasing-confirmation');
            }, 1);

            reset();

            return true;
        }

        function broadcastTransaction() {
            leasing.broadcast.broadcast();
        }

        function reset() {
            leasing.amount = 0;
            leasing.recipient = '';
            leasing.fee = {
                amount: DEFAULT_FEE_AMOUNT,
                isValid: true
            };
            leasing.autocomplete.defaultFee(Number(DEFAULT_FEE_AMOUNT));
        }
    }

    WavesLeasingController.$inject = ['$scope', '$timeout', 'constants.ui', 'wallet.events', 'autocomplete.fees',
        'applicationContext', 'apiService', 'dialogService', 'notificationService', 'transactionBroadcast',
        'formattingService', 'addressService'];

    angular
        .module('app.wallet')
        .controller('leasingController', WavesLeasingController);
})();
