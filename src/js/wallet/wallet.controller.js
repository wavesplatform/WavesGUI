(function () {
    'use strict';

    var DEFAULT_FEE_AMOUNT = '0.001';

    function WavesWalletController($scope, $timeout, $interval, constants, autocomplete, applicationContext,
                              dialogService, addressService, utilityService, apiService, notificationService,
                              formattingService, transferService, transactionLoadingService) {
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
            recipient: '',
            paymentPending: false
        };
        wallet.transfer = autocomplete;
        wallet.paymentValidationOptions = {
            rules: {
                wavesrecipient: {
                    required: true,
                    address: true
                },
                wavessendamount: {
                    required: true,
                    decimal: Currency.WAV.precision,
                    min: minimumPayment.toTokens()
                },
                wavessendfee: {
                    required: true,
                    decimal: Currency.WAV.precision,
                    min: minimumFee.toTokens()
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
                    min: 'Payment amount is too small. It should be greater or equal to ' +
                        minimumPayment.formatAmount(false)
                },
                wavessendfee: {
                    required: 'Transaction fee is required',
                    decimal: 'Transaction fee must be with no more than ' +
                        minimumFee.currency.precision + ' digits after the decimal point (.)',
                    min: 'Transaction fee is too small. It should be greater or equal to ' +
                        minimumFee.formatAmount(true)
                }
            }
        };
        wallet.send = send;
        wallet.withdraw = withdraw;
        wallet.trade = trade;
        wallet.submitPayment = submitPayment;
        wallet.broadcastSendTransaction = broadcastSendTransaction;

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
            // here we have a direct markup dependency
            // but other ways of getting the form from a child scope are even more ugly
            return angular.element('#send-waves-form').scope().sendWavesForm;
        }

        function submitPayment() {
            var paymentForm = getPaymentForm();
            var invalid = paymentForm.invalid();
            wallet.transfer.fee.isValid = angular.isDefined(invalid.wavessendfee) ?
                !invalid.wavessendfee : true;
            if (!paymentForm.validate(wallet.paymentValidationOptions) || !wallet.transfer.fee.isValid)
                // prevent payment dialog from closing if it's not valid
                return false;

            wallet.transfer.fee.amount = wallet.transfer.getFeeAmount();

            var currentCurrency = wallet.current.balance.currency;
            var payment = {
                amount: new Money(wallet.transfer.amount, currentCurrency),
                fee: new Money(wallet.transfer.fee.amount, currentCurrency),
                recipient: addressService.cleanupOptionalPrefix(wallet.transfer.recipient),
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
            wallet.confirm.recipient = payment.recipient;

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

            // prevent method execution when there is a pending payment request
            if (wallet.confirm.paymentPending)
                return;

            //disable confirm button
            wallet.confirm.paymentPending = true;

            apiService.broadcastPayment(transaction).then(function () {
                var amount = Money.fromCoins(transaction.amount, wallet.current.balance.currency);
                var address = transaction.recipient;
                var displayMessage = 'Sent ' + amount.formatAmount(true) + amount.currency.symbol +
                    '<br>Recipient ' + address.substr(0,15) + '...<br>Date: ' +
                    formattingService.formatTimestamp(transaction.timestamp);
                notificationService.notice(displayMessage);
            }, function (response) {
                if (response.data)
                    notificationService.error('Error:' + response.data.error + ' - ' + response.data.message);
                else
                    notificationService.error('Request failed. Status: ' + response.status + ' - ' +
                        response.statusText);
            }).finally(function () {
                //enable confirm button
                wallet.confirm.paymentPending = false;
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
            var txArray;
            transactionLoadingService.loadTransactions(applicationContext.account.address)
                .then(function (transactions) {
                    txArray = transactions;

                    return transactionLoadingService.refreshAssetCache(applicationContext.cache.assets, transactions);
                })
                .then(function () {
                    wallet.transactions = txArray;
                });
        }

        function resetPaymentForm() {
            wallet.transfer.recipient = '';
            wallet.transfer.amount = '0';
            wallet.transfer.fee = {
                amount: DEFAULT_FEE_AMOUNT,
                isValid: true
            };

            wallet.transfer.defaultFee(Number(DEFAULT_FEE_AMOUNT));
        }
    }

    WavesWalletController.$inject = ['$scope', '$timeout', '$interval', 'constants.ui',
        'autocomplete.fees', 'applicationContext',
        'dialogService', 'addressService', 'utilityService', 'apiService', 'notificationService',
        'formattingService', 'transferService', 'transactionLoadingService'];

    angular
        .module('app.wallet')
        .controller('walletController', WavesWalletController);
})();
