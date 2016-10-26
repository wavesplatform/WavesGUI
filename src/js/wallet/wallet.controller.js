(function () {
    'use strict';

    function WalletController($scope, $timeout, $interval, constants, applicationContext, dialogService,
                              addressService, utilityService, apiService, notificationService, formattingService,
                              transferService, transactionLoadingService) {
        var wallet = this;
        var transaction, refreshPromise;
        var refreshDelay = 10 * 1000;
        var minimumPayment = new Money(constants.MINIMUM_PAYMENT_AMOUNT, Currency.WAV);
        var minimumFee = new Money(constants.MINIMUM_TRANSACTION_FEE, Currency.WAV);

        function unimplementedFeature() {
            $scope.home.featureUnderDevelopment();
        }

        function findWalletByCurrency(currency) {
            return _.find(wallet.wallets, function (w) {
                return w.balance.currency === currency;
            });
        }

        wallet.wallets = [
            {
                balance: new Money(0, Currency.USD)
            },
            {
                balance: new Money(0, Currency.EUR)
            },
            {
                balance: new Money(0, Currency.BTC)
            },
            {
                balance: new Money(0, Currency.WAV)
            },
            {
                balance: new Money(0, Currency.CNY)
            }
        ];
        wallet.current = wallet.wallets[0];
        wallet.transactions = [];
        wallet.confirm = {
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
        wallet.transfer = {
            fees: [
                {
                    amount: 0.001,
                    displayText: '0.001 WAVE (Economic)'
                },
                {
                    amount: 0.0015,
                    displayText: '0.0015 WAVE (Standard)'
                },
                {
                    amount: 0.002,
                    displayText: '0.002 WAVE (Premium)'
                }
            ],
            selectedFee: undefined,
            searchText: undefined,
            querySearch: function (searchText) {
                if (!searchText)
                    return wallet.transfer.fees;

                return _.filter(wallet.transfer.fees, function (item) {
                    return item.amount.toString().indexOf(searchText) !== -1;
                });
            }
        };
        wallet.paymentValidationOptions = {
            rules: {
                wavesrecipient: {
                    required: true,
                    address: true
                },
                wavessendamount: {
                    required: true,
                    decimal: Currency.WAV.precision,
                    min: minimumPayment.amount
                },
                wavessendfee: {
                    required: true,
                    decimal: Currency.WAV.precision,
                    min: minimumFee.amount
                }
            },
            messages: {
                wavesrecipient: {
                    required: 'Recipient account number is required'
                },
                wavessendamount: {
                    required: 'Amount to send is required',
                    decimal: 'The amount to send must be a number with no more than ' +
                        minimumPayment.currency.precision + ' digits after the decimal point (.)',
                    min: 'Payment amount is too small. It should be greater or equal to ' + minimumPayment.formatAmount(false)
                },
                wavessendfee: {
                    required: 'Transaction fee is required',
                    decimal: 'Transaction fee must be with no more than ' +
                        minimumFee.currency.precision + ' digits after the decimal point (.)',
                    min: 'Transaction fee is too small. It should be greater or equal to ' + minimumFee.formatAmount(true)
                }
            }
        };
        wallet.send = send;
        wallet.withdraw = withdraw;
        wallet.trade = trade;
        wallet.submitPayment = submitPayment;
        wallet.broadcastSendTransaction = broadcastSendTransaction;
        wallet.getPaymentForm = getPaymentForm;

        resetPaymentForm();
        loadDataFromBackend();

        $scope.$on('$destroy', function () {
            if (angular.isDefined(refreshPromise)) {
                $interval.cancel(refreshPromise);
                refreshPromise = undefined;
            }
        });

        function send (currency) {
            switch (currency) {
                case Currency.WAV:
                    dialogService.open('#wB-butSend-WAV');
                    break;

                default:
                    unimplementedFeature();
            }

            wallet.current = findWalletByCurrency(currency);
        }

        function withdraw (currency) {
            unimplementedFeature();
        }

        function trade (currency) {
            unimplementedFeature();
        }

        function getPaymentForm() {
            return angular.element('#send-waves-form').scope().sendWavesForm;
        }

        function submitPayment() {
            // here we have a direct markup dependency
            var paymentForm = getPaymentForm();
            wallet.transfer.fee.isValid = angular.isDefined(paymentForm.invalid.wavessendfee) ?
                paymentForm.invalid.wavessendfee : true;
            if (!paymentForm.validate())
                // prevent payment dialog from closing if it's not valid
                return false;

            if (angular.isDefined(wallet.transfer.selectedFee))
                wallet.transfer.fee.amount = wallet.transfer.selectedFee.amount;
            else
                wallet.transfer.fee.amount = wallet.transfer.searchText;

            var currentCurrency = wallet.current.balance.currency;
            var payment = {
                amount: new Money(wallet.transfer.amount, currentCurrency),
                fee: new Money(wallet.transfer.fee.amount, currentCurrency),
                recipient: addressService.fromDisplayAddress(wallet.transfer.recipient),
                time: utilityService.getTime()
            };

            var sender = {
                address: applicationContext.account.address,
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            };

            // creating the transaction and waiting for confirmation
            transaction = transferService.createTransaction(payment, sender);

            // setting data for the confirmation dialog
            wallet.confirm.amount.value = payment.amount.formatAmount(true);
            wallet.confirm.amount.currency = payment.amount.currency.displayName;
            wallet.confirm.fee.value = payment.fee.formatAmount(true);
            wallet.confirm.fee.currency = payment.fee.currency.displayName;
            wallet.confirm.recipient = payment.recipient.getDisplayAddress();

            // open confirmation dialog
            // doing it async because this method is called while another dialog is open
            $timeout(function () {
                dialogService.open('#send-payment-confirmation');
            }, 1);

            resetPaymentForm();

            // it's ok to close payment dialog
            return true;
        }

        function broadcastSendTransaction() {
            // checking if transaction was saved
            if (angular.isUndefined(transaction))
                return;

            //todo: disable confirm button
            apiService.broadcastPayment(transaction).then(function () {
                var amount = Money.fromCoins(transaction.amount, wallet.current.balance.currency);
                var address = addressService.fromRawAddress(transaction.recipient).getDisplayAddress();
                var displayMessage = 'Sent ' + amount.formatAmount(true) + amount.currency.symbol +
                    '<br>Recipient ' + address.substr(0,15) + '...<br>Date: ' +
                    formattingService.formatTimestamp(transaction.time);
                notificationService.notice(displayMessage);
                //todo: enable confirm button

                transaction = undefined;
            }, function (response) {
                notificationService.error('Error:' + response.error + ' - ' + response.message);
                //todo: enable confirm button

                transaction = undefined;
            });
        }

        function loadDataFromBackend() {
            refreshWallets();
            refreshTransactions();

            refreshPromise = $interval(function() {
                refreshWallets();
                refreshTransactions();
            }, refreshDelay);
        }

        function refreshWallets() {
            _.forEach(wallet.wallets, function (item) {
                if (item.balance.currency === Currency.WAV) {
                    apiService.address.balance(applicationContext.account.address)
                        .then(function (response) {
                            item.balance = Money.fromCoins(response.balance, item.balance.currency);
                        });
                }
            });
        }

        function refreshTransactions() {
            transactionLoadingService.loadTransactions(applicationContext.account.address)
                .then(function (transactions) {
                    wallet.transactions = transactions;
                });
        }

        function resetPaymentForm() {
            wallet.transfer.recipient = '';
            wallet.transfer.amount = '0';
            wallet.transfer.fee = {
                amount: '0.001',
                isValid: true
            };
        }
    }

    WalletController.$inject = ['$scope', '$timeout', '$interval', 'constants.ui', 'applicationContext',
        'dialogService', 'addressService', 'utilityService', 'apiService', 'notificationService',
        'formattingService', 'transferService', 'transactionLoadingService'];

    angular
        .module('app.wallet')
        .controller('walletController', WalletController);
})();
