(function () {
    'use strict';

    var FEE_CURRENCY = Currency.WAVES;

    function LeasingFormController($timeout, constants, applicationContext,
                                   apiService, dialogService, notificationService, transactionBroadcast,
                                   formattingService, addressService, leasingService, leasingRequestService) {
        var ctrl = this;
        var minimumFee = new Money(constants.MINIMUM_TRANSACTION_FEE, FEE_CURRENCY);

        ctrl.fee = minimumFee;
        ctrl.availableBalance = Money.fromCoins(0, Currency.WAVES);

        ctrl.broadcast = new transactionBroadcast.instance(apiService.leasing.lease,
            function (transaction) {
                var amount = Money.fromCoins(transaction.amount, Currency.WAVES);
                var address = transaction.recipient;
                var displayMessage = 'Leased ' + amount.formatAmount(true) + ' of ' +
                    amount.currency.displayName +
                    '<br/>Recipient ' + address.substr(0,15) + '...<br/>Date: ' +
                    formattingService.formatTimestamp(transaction.timestamp);
                notificationService.notice(displayMessage);
            }
        );

        ctrl.validationOptions = {
            rules: {
                leasingRecipient: {
                    required: true
                },
                leasingAmount: {
                    required: true,
                    decimal: 8, // stub value updated on validation
                    min: 0, // stub value updated on validation
                    max: constants.JAVA_MAX_LONG // stub value updated on validation
                }
            },
            messages: {
                leasingRecipient: {
                    required: 'Recipient account number is required'
                },
                leasingAmount: {
                    required: 'Amount to lease is required'
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

                // Update validation options and check how they affect form validation
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
            var transferFee = ctrl.fee;

            // We assume here that amount and fee are in Waves, however it's not hardcoded
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

            // Create a transaction and wait for confirmation
            ctrl.broadcast.setTransaction(leasingRequestService.buildStartLeasingRequest(startLeasing, sender));

            // Set data to the confirmation dialog
            ctrl.confirm.amount = startLeasing.amount;
            ctrl.confirm.fee = startLeasing.fee;
            ctrl.confirm.recipient = startLeasing.recipient;

            // Open confirmation dialog (async because this method is called while another dialog is open)
            $timeout(function () {
                dialogService.open('#start-leasing-confirmation');
            }, 1);

            // Close payment dialog
            return true;
        }

        function broadcastTransaction() {
            ctrl.broadcast.broadcast();
        }

        function reset() {
            ctrl.amount = '0';
            ctrl.recipient = '';
            ctrl.confirm.amount = Money.fromTokens(0, Currency.WAVES);
            ctrl.confirm.fee = minimumFee;
        }
    }

    LeasingFormController.$inject = ['$timeout', 'constants.ui', 'applicationContext',
                                     'apiService', 'dialogService', 'notificationService', 'transactionBroadcast',
                                     'formattingService', 'addressService', 'leasingService', 'leasingRequestService'];

    angular
        .module('app.leasing')
        .component('wavesLeasingLeaseForm', {
            controller: LeasingFormController,
            templateUrl: 'leasing/lease.form.component'
        });
})();
