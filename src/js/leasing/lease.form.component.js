(function () {
    'use strict';

    var DEFAULT_FEE_AMOUNT = '0.001';
    var FEE_CURRENCY = Currency.WAVES;

    function WavesLeasingFormController($timeout, constants, autocomplete, applicationContext,
                                     apiService, dialogService, notificationService, transactionBroadcast,
                                     formattingService, addressService, leasingService, leasingRequestService) {
        var minimumFee = new Money(constants.MINIMUM_TRANSACTION_FEE, FEE_CURRENCY);

        var ctrl = this;
        ctrl.autocomplete = autocomplete;
        ctrl.availableBalance = Money.fromCoins(0, Currency.WAVES);
        ctrl.broadcast = new transactionBroadcast.instance(apiService.leasing.lease,
            function (transaction, response) {
                var amount = Money.fromCoins(transaction.amount, Currency.WAVES);
                var address = transaction.recipient;
                var displayMessage = 'Leased ' + amount.formatAmount(true) + ' of ' +
                    amount.currency.displayName +
                    '<br/>Recipient ' + address.substr(0,15) + '...<br/>Date: ' +
                    formattingService.formatTimestamp(transaction.timestamp);
                notificationService.notice(displayMessage);
            });
        ctrl.validationOptions = {
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
                    decimal: Currency.WAVES.precision,
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
        ctrl.confirm = {
            recipient: ''
        };
        ctrl.confirmLease = confirmLease;
        ctrl.broadcastTransaction = broadcastTransaction;

        reset();

        leasingService
            .loadBalanceDetails(applicationContext.account.address)
            .then(function (balanceDetails) {
                //FIXME: add here a correct value available to lease
                ctrl.availableBalance = balanceDetails.effective;

                reset();

                // update validation options and check how it affects form validation
                ctrl.validationOptions.rules.leasingAmount.decimal = ctrl.availableBalance.currency.precision;
                var minimumPayment = Money.fromCoins(1, ctrl.availableBalance.currency);
                ctrl.validationOptions.rules.leasingAmount.min = minimumPayment.toTokens();
                ctrl.validationOptions.rules.leasingAmount.max = ctrl.availableBalance.toTokens();
                ctrl.validationOptions.messages.leasingAmount.decimal = 'The amount to leasing must be a number ' +
                    'with no more than ' + minimumPayment.currency.precision +
                    ' digits after the decimal point (.)';
                ctrl.validationOptions.messages.leasingAmount.min = 'Leasing amount is too small. ' +
                    'It should be greater or equal to ' + minimumPayment.formatAmount(false);
                ctrl.validationOptions.messages.leasingAmount.max = 'Leasing amount is too big. ' +
                    'It should be less or equal to ' + ctrl.availableBalance.formatAmount(false);
            });

        function confirmLease(form) {
            if (!form.validate(ctrl.validationOptions)) {
                return false;
            }

            var amount = Money.fromTokens(ctrl.amount, ctrl.availableBalance.currency);
            var transferFee = Money.fromTokens(ctrl.autocomplete.getFeeAmount(), FEE_CURRENCY);

            // we assume here that amount and fee are in Waves, however it's not hardcoded
            var leasingCost = amount.plus(transferFee);
            if (leasingCost.greaterThan(ctrl.availableBalance)) {
                notificationService.error('Not enough ' + FEE_CURRENCY.displayName + ' for the leasing transaction');

                return false;
            }

            var startLeasing = {
                recipient: addressService.cleanupOptionalPrefix(ctrl.recipient),
                amount: amount,
                fee: transferFee
            };

            var sender = {
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            };

            // creating the transaction and waiting for confirmation
            ctrl.broadcast.setTransaction(leasingRequestService.buildStartLeasingRequest(startLeasing, sender));

            // setting data for the confirmation dialog
            ctrl.confirm.amount = startLeasing.amount;
            ctrl.confirm.fee = startLeasing.fee;
            ctrl.confirm.recipient = startLeasing.recipient;

            // open confirmation dialog
            // doing it async because this method is called while another dialog is open
            $timeout(function () {
                dialogService.open('#start-leasing-confirmation');
            }, 1);

            return true;
        }

        function broadcastTransaction() {
            ctrl.broadcast.broadcast();
        }

        function reset() {
            ctrl.amount = '0';
            ctrl.recipient = '';
            ctrl.confirm.amount = Money.fromTokens(0, Currency.WAVES);
            ctrl.confirm.fee = Money.fromTokens(DEFAULT_FEE_AMOUNT, FEE_CURRENCY);
            ctrl.autocomplete.defaultFee(Number(DEFAULT_FEE_AMOUNT));
        }
    }

    WavesLeasingFormController.$inject = ['$timeout', 'constants.ui', 'autocomplete.fees',
        'applicationContext', 'apiService', 'dialogService', 'notificationService', 'transactionBroadcast',
        'formattingService', 'addressService', 'leasingService', 'leasingRequestService'];

    angular
        .module('app.leasing')
        .component('wavesLeasingLeaseForm', {
            controller: WavesLeasingFormController,
            templateUrl: 'leasing/lease.form.component'
        });
})();
