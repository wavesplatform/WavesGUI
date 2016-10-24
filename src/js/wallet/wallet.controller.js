(function () {
    'use strict';

    function WalletController($scope, $timeout, $interval, applicationContext, dialogService, addressService,
                              utilityService, apiService, notificationService, formattingService,
                              transferService, transactionLoadingService) {
        var wallet = this;
        var transaction, refreshPromise;
        var refreshDelay = 10 * 1000;

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
        wallet.transfer = {};
        wallet.paymentValidationOptions = {
            rules: {

            },
            messages: {

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
            paymentForm.$setSubmitted();
            if (paymentForm.$invalid)
                // prevent payment dialog from closing
                return false;

            var currentCurrency = wallet.current.balance.currency;
            var payment = {
                amount: new Money(wallet.transfer.amount, currentCurrency),
                fee: new Money(wallet.transfer.fee, currentCurrency),
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
                var amount = new Money(transaction.amount, wallet.current.balance.currency);
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
            wallet.transfer.fee = '0.001';
        }
    }

    WalletController.$inject = ['$scope', '$timeout', '$interval', 'applicationContext', 'dialogService',
        'addressService', 'utilityService', 'apiService', 'notificationService',
        'formattingService', 'transferService', 'transactionLoadingService'];

    angular
        .module('app.wallet')
        .controller('walletController', WalletController);
})();
