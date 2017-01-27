(function () {
    'use strict';

    var DEFAULT_FEE_AMOUNT = '0.001';

    function WavesWalletWithdrawController ($scope, $timeout, constants, events, autocomplete, dialogService,
                                            coinomatService, transactionBroadcast, notificationService,
                                            apiService, formattingService, assetService, applicationContext) {
        var withdraw = this;
        var minimumFee = new Money(constants.MINIMUM_TRANSACTION_FEE, Currency.WAV);

        withdraw.broadcast = new transactionBroadcast.instance(apiService.assets.transfer, function () {
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
            rules: {
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
                }
            },
            messages: {
                withdrawAmount: {
                    required: 'Amount to withdraw is required'
                },
                withdrawFee: {
                    required: 'Gateway transaction fee is required',
                    decimal: 'Transaction fee must be with no more than ' +
                        minimumFee.currency.precision + ' digits after the decimal point (.)',
                    min: 'Transaction fee is too small. It should be greater or equal to ' +
                        minimumFee.formatAmount(true)
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
        withdraw.submitWithdraw = submitWithdraw;
        withdraw.confirmWithdraw = confirmWithdraw;
        withdraw.refreshAmounts = refreshAmounts;
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
                    withdraw.correction = response.out_prec.correction;
                    withdraw.targetCurrency = response.to_txt;
                    withdraw.exchangeAmount = '0';
                    withdraw.amount = response.in_def;
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

                    refreshAmounts();

                    dialogService.open('#withdraw-asset-dialog');
                }).catch(function (exception) {
                    notificationService.error(exception.message);
                });
        });

        function getAmountForm () {
            // here we have a direct markup dependency
            // but other ways of getting the form from a child scope are even more ugly
            return angular.element('#withdraw-asset-form').scope().withdrawAssetForm;
        }

        function submitWithdraw () {
            var amountForm = withdraw.getAmountForm();

            if (!amountForm.validate(withdraw.validationOptions))
                return false;

            var withdrawCost = Money.fromTokens(withdraw.autocomplete.getFeeAmount(), Currency.WAV);
            if (withdrawCost.greaterThan(withdraw.wavesBalance)) {
                notificationService.error('Not enough Waves for the withdraw transfer');

                return false;
            }

            $timeout(function () {
                dialogService.open('#withdraw-address-dialog');
            }, 1);

            return true;
        }

        function confirmWithdraw () {
            try {
                ensureValidAddress(withdraw.recipient);

                var amount = Money.fromTokens(withdraw.amount, withdraw.assetBalance.currency);
                var fee = Money.fromTokens(withdraw.autocomplete.getFeeAmount(), Currency.WAV);
                withdraw.confirm.amount.value = amount.formatAmount(true);
                withdraw.confirm.amount.currency = amount.currency.displayName;
                withdraw.confirm.fee.value = fee.formatAmount(true);
                withdraw.confirm.fee.currency = fee.currency.displayName;
                withdraw.confirm.recipient = withdraw.recipient;

                coinomatService.getWithdrawAddress(withdraw.assetBalance.currency, withdraw.recipient)
                    .then(function (gatewayAddress) {
                        withdraw.confirm.gatewayAddress = gatewayAddress;

                        var assetTransfer = {
                            recipient: gatewayAddress,
                            amount: amount,
                            fee: fee
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
                        notificationService.error(exception.message);
                    });

                return true;
            }
            catch (e) {
                notificationService.error(e.message);

                return false;
            }
        }

        function ensureValidAddress(address) {
            if (!address)
                throw new Error('Bitcoin address is required');

            if (!address.match(/^[13][0-9a-z]{26,33}$/i))
                throw new Error('Bitcoin address is invalid. Expected address length is from 27 to 34 symbols');
        }

        function broadcastTransaction () {
            withdraw.broadcast.broadcast();
        }

        function refreshAmounts () {
            var exchangeAmount = Money.fromTokens(withdraw.amount * withdraw.exchangeRate * withdraw.correction,
                withdraw.assetBalance.currency);
            withdraw.exchangeAmount = exchangeAmount.formatAmount(true);
        }

        function resetForm () {
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
