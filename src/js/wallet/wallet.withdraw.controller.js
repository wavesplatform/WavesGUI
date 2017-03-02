(function () {
    'use strict';

    var DEFAULT_FEE_AMOUNT = '0.001';

    function WavesWalletWithdrawController ($scope, $timeout, constants, events, autocomplete, dialogService,
                                            coinomatService, transactionBroadcast, notificationService,
                                            apiService, formattingService, assetService, applicationContext) {
        var withdraw = this;
        var minimumFee = new Money(constants.MINIMUM_TRANSACTION_FEE, Currency.WAV);

        withdraw.broadcast = new transactionBroadcast.instance(apiService.assets.transfer,
            function (transaction, response) {
                var amount = Money.fromCoins(transaction.amount, withdraw.assetBalance.currency);
                var address = transaction.recipient;
                var displayMessage = 'Sent ' + amount.formatAmount(true) + ' of ' +
                    withdraw.assetBalance.currency.displayName +
                    '<br/>Gateway ' + address.substr(0,15) + '...<br/>Date: ' +
                    formattingService.formatTimestamp(transaction.timestamp);
                notificationService.notice(displayMessage);
            });
        withdraw.autocomplete = autocomplete;
        withdraw.validationOptions = {
            onfocusout: function (element) {
                return !(element.name in ['withdrawFee']); // FIXME
            },
            rules: {
                withdrawAddress: {
                    required: true
                },
                withdrawAmount: {
                    required: true,
                    decimal: 8,
                    min: 0,
                    max: constants.JAVA_MAX_LONG
                },
                withdrawFee: {
                    required: true,
                    decimal: Currency.WAV.precision,
                    min: minimumFee.toTokens()
                },
                withdrawTotal: {
                    required: true,
                    decimal: 8,
                    min: 0,
                    max: constants.JAVA_MAX_LONG
                }
            },
            messages: {
                withdrawAddress: {
                    required: 'Bitcoin address is required'
                },
                withdrawAmount: {
                    required: 'Amount to withdraw is required'
                },
                withdrawFee: {
                    required: 'Gateway transaction fee is required',
                    decimal: 'Transaction fee must be with no more than ' +
                        minimumFee.currency.precision + ' digits after the decimal point (.)',
                    min: 'Transaction fee is too small. It should be greater or equal to ' +
                        minimumFee.formatAmount(true)
                },
                withdrawTotal: {
                    required: 'Total amount is required'
                }
            }
        };
        withdraw.confirm = {
            amount: {
                value: '0',
                currency: ''
            },
            fee: {
                value: '0',
                currency: ''
            },
            gatewayAddress: '',
            address: ''
        };
        withdraw.confirmWithdraw = confirmWithdraw;
        withdraw.refreshAmount = refreshAmount;
        withdraw.refreshTotal = refreshTotal;
        withdraw.getAmountForm = getAmountForm;
        withdraw.broadcastTransaction = broadcastTransaction;

        resetForm();

        $scope.$on(events.WALLET_WITHDRAW, function (event, eventData) {
            withdraw.assetBalance = eventData.assetBalance;
            withdraw.wavesBalance = eventData.wavesBalance;

            if (withdraw.assetBalance.currency.id !== Currency.BTC.id) {
                $scope.home.featureUnderDevelopment();

                return;
            }

            coinomatService.getWithdrawRate(withdraw.assetBalance.currency)
                .then(function (response) {
                    /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
                    var minimumPayment = Money.fromCoins(1, withdraw.assetBalance.currency);
                    minimumPayment = Money.fromTokens(Math.max(minimumPayment.toTokens(), response.in_min),
                        withdraw.assetBalance.currency);
                    var maximumPayment = Money.fromTokens(Math.min(withdraw.assetBalance.toTokens(),
                        response.in_max), withdraw.assetBalance.currency);
                    withdraw.sourceCurrency = withdraw.assetBalance.currency.displayName;
                    withdraw.exchangeRate = response.xrate;
                    withdraw.feeIn = response.fee_in;
                    withdraw.feeOut = response.fee_out;
                    withdraw.targetCurrency = response.to_txt;
                    withdraw.total = response.in_def;
                    /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
                    withdraw.validationOptions.rules.withdrawAmount.decimal = withdraw.assetBalance.currency.precision;
                    withdraw.validationOptions.rules.withdrawAmount.max = maximumPayment.toTokens();
                    withdraw.validationOptions.rules.withdrawAmount.min = minimumPayment.toTokens();
                    withdraw.validationOptions.messages.withdrawAmount.decimal = 'The amount to withdraw must be ' +
                        'a number with no more than ' + minimumPayment.currency.precision +
                        ' digits after the decimal point (.)';
                    withdraw.validationOptions.messages.withdrawAmount.min = 'Withdraw amount is too small. ' +
                        'It should be greater or equal to ' + minimumPayment.formatAmount();
                    withdraw.validationOptions.messages.withdrawAmount.max = 'Withdraw amount is too big. ' +
                        'It should be less or equal to ' + maximumPayment.formatAmount();

                    refreshAmount();

                    dialogService.open('#withdraw-asset-dialog');
                }).catch(function (exception) {
                    //TODO: make this better
                    notificationService.error(exception.error);
                });
        });

        function getAmountForm () {
            // here we have a direct markup dependency
            // but other ways of getting the form from a child scope are even more ugly
            return angular.element('#withdraw-asset-form').scope().withdrawAssetForm;
        }

        function confirmWithdraw () {
            var amountForm = withdraw.getAmountForm();

            if (!amountForm.validate(withdraw.validationOptions))
                return false;

            var withdrawCost = Money.fromTokens(withdraw.autocomplete.getFeeAmount(), Currency.WAV);
            if (withdrawCost.greaterThan(withdraw.wavesBalance)) {
                notificationService.error('Not enough Waves for the withdraw transfer');

                return false;
            }

            if (!withdraw.recipient.match(/^[0-9a-z]{27,34}$/i)) {
                notificationService.error('Bitcoin address is invalid. ' +
                    'Expected address length is from 27 to 34 symbols');

                return false;
            }

            var total = Money.fromTokens(withdraw.total, withdraw.assetBalance.currency);
            var fee = Money.fromTokens(withdraw.autocomplete.getFeeAmount(), Currency.WAV);
            withdraw.confirm.amount.value = total.formatAmount(true);
            withdraw.confirm.amount.currency = total.currency.displayName;
            withdraw.confirm.fee.value = fee.formatAmount(true);
            withdraw.confirm.fee.currency = fee.currency.displayName;
            withdraw.confirm.recipient = withdraw.recipient;

            coinomatService.getWithdrawDetails(withdraw.assetBalance.currency, withdraw.recipient)
                .then(function (withdrawDetails) {
                    withdraw.confirm.gatewayAddress = withdrawDetails.address;

                    var assetTransfer = {
                        recipient: withdrawDetails.address,
                        amount: total,
                        fee: fee,
                        attachment: converters.stringToByteArray(withdrawDetails.attachment)
                    };
                    var sender = {
                        publicKey: applicationContext.account.keyPair.public,
                        privateKey: applicationContext.account.keyPair.private
                    };
                    // creating the transaction and waiting for confirmation
                    withdraw.broadcast.setTransaction(assetService.createAssetTransferTransaction(assetTransfer,
                        sender));

                    resetForm();

                    dialogService.open('#withdraw-confirmation');
                })
                .catch(function (exception) {
                    console.log(JSON.stringify(exception));
                    notificationService.error(exception.message);
                });

            return true;
        }

        function broadcastTransaction () {
            withdraw.broadcast.broadcast();
        }

        function refreshTotal () {
            var amount = withdraw.exchangeRate * withdraw.amount;
            var total = Money.fromTokens(amount + withdraw.feeIn + withdraw.feeOut, withdraw.assetBalance.currency);
            withdraw.total = total.formatAmount(true);
        }

        function refreshAmount () {
            var total = Math.max(0, withdraw.exchangeRate * (withdraw.total - withdraw.feeIn) - withdraw.feeOut);
            var amount = Money.fromTokens(total, withdraw.assetBalance.currency);
            withdraw.amount = amount.formatAmount(true);
        }

        function resetForm () {
            withdraw.recipient = '';
            withdraw.address = '';
            withdraw.autocomplete.defaultFee(Number(DEFAULT_FEE_AMOUNT));
        }
    }

    WavesWalletWithdrawController.$inject = ['$scope', '$timeout', 'constants.ui', 'wallet.events', 'autocomplete.fees',
        'dialogService', 'coinomatService', 'transactionBroadcast', 'notificationService', 'apiService',
        'formattingService', 'assetService', 'applicationContext'];

    angular
        .module('app.wallet')
        .controller('walletWithdrawController', WavesWalletWithdrawController);
})();
