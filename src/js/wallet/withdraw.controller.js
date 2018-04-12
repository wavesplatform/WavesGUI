(function () {
    'use strict';

    var DEFAULT_FEE_AMOUNT = '0.001',
        DEFAULT_ERROR_MESSAGE = 'Connection is lost';

    function WavesWalletWithdrawController ($scope, constants, events, autocomplete, dialogService, $element,
                                            coinomatService, transactionBroadcast, notificationService,
                                            apiService, formattingService, assetService, applicationContext) {

        var ctrl = this;
        var type = $element.data('type');

        var minimumFee = new Money(constants.MINIMUM_TRANSACTION_FEE, Currency.WAVES);
        var notPermittedBitcoinAddresses = {};

        ctrl.broadcast = new transactionBroadcast.instance(apiService.assets.transfer,
            function (transaction) {
                var amount = Money.fromCoins(transaction.amount, ctrl.assetBalance.currency);
                var address = transaction.recipient;
                var displayMessage = 'Sent ' + amount.formatAmount(true) + ' of ' +
                    ctrl.assetBalance.currency.displayName +
                    '<br/>Gateway ' + address.substr(0,15) + '...<br/>Date: ' +
                    formattingService.formatTimestamp(transaction.timestamp);
                notificationService.notice(displayMessage);
            });

        ctrl.autocomplete = autocomplete;

        ctrl.validationOptions = {
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
                    decimal: Currency.WAVES.precision,
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

        ctrl.confirm = {
            amount: {},
            fee: {},
            gatewayAddress: '',
            address: ''
        };

        ctrl.confirmWithdraw = confirmWithdraw;
        ctrl.refreshAmount = refreshAmount;
        ctrl.refreshTotal = refreshTotal;
        ctrl.broadcastTransaction = broadcastTransaction;
        ctrl.gatewayEmail = 'support@coinomat.com';

        resetForm();

        $scope.$on(events.WALLET_WITHDRAW + type, function (event, eventData) {
            ctrl.assetBalance = eventData.assetBalance;
            ctrl.wavesBalance = eventData.wavesBalance;

            if (ctrl.assetBalance.currency === Currency.BTC ||
                ctrl.assetBalance.currency === Currency.ETH ||
                ctrl.assetBalance.currency === Currency.LTC ||
                ctrl.assetBalance.currency === Currency.ZEC ||
                ctrl.assetBalance.currency === Currency.BCH
            ) {
                withdrawCrypto();
            } else if (ctrl.assetBalance.currency === Currency.EUR) {
                withdrawEUR();
            } else if (ctrl.assetBalance.currency === Currency.USD) {
                withdrawUSD();
            } else {
                $scope.home.featureUnderDevelopment();
            }
        });

        function withdrawCrypto() {
            coinomatService.getWithdrawRate(ctrl.assetBalance.currency)
                .then(function (response) {
                    /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
                    var minimumPayment = Money.fromCoins(1, ctrl.assetBalance.currency);
                    minimumPayment = Money.fromTokens(Math.max(minimumPayment.toTokens(), response.in_min),
                        ctrl.assetBalance.currency);
                    var maximumPayment = Money.fromTokens(Math.min(ctrl.assetBalance.toTokens(),
                        response.in_max), ctrl.assetBalance.currency);
                    ctrl.sourceCurrency = ctrl.assetBalance.currency.displayName;
                    ctrl.isEthereum = (ctrl.assetBalance.currency === Currency.ETH);
                    ctrl.exchangeRate = response.xrate;
                    ctrl.feeIn = response.fee_in;
                    ctrl.feeOut = response.fee_out;
                    ctrl.targetCurrency = response.to_txt;
                    ctrl.total = response.in_def;
                    ctrl.minimumPayment = minimumPayment;
                    /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
                    ctrl.validationOptions.rules.withdrawAmount.decimal = ctrl.assetBalance.currency.precision;
                    ctrl.validationOptions.rules.withdrawAmount.max = maximumPayment.toTokens();
                    ctrl.validationOptions.rules.withdrawAmount.min = minimumPayment.toTokens();
                    ctrl.validationOptions.messages.withdrawAddress.required = minimumPayment.currency.displayName +
                        ' address is required';
                    ctrl.validationOptions.messages.withdrawAmount.decimal = 'The amount to withdraw must be ' +
                        'a number with no more than ' + minimumPayment.currency.precision +
                        ' digits after the decimal point (.)';
                    ctrl.validationOptions.messages.withdrawAmount.min = 'Withdraw amount is too small. ' +
                        'It should be greater or equal to ' + minimumPayment.formatAmount();
                    ctrl.validationOptions.messages.withdrawAmount.max = 'Withdraw amount is too big. ' +
                        'It should be less or equal to ' + maximumPayment.formatAmount();

                    refreshAmount();

                    dialogService.open('#withdraw-crypto-dialog');
                }).catch(function (exception) {
                if (exception && exception.data && exception.data.error) {
                    notificationService.error(exception.error);
                } else {
                    notificationService.error(DEFAULT_ERROR_MESSAGE);
                }
            }).then(function () {
                return coinomatService.getDepositDetails(Currency.BTC, Currency.BTC,
                    applicationContext.account.address);
            }).then(function (depositDetails) {
                notPermittedBitcoinAddresses[depositDetails.address] = 1;

                return coinomatService.getDepositDetails(Currency.BTC, Currency.WAVES,
                    applicationContext.account.address);
            }).then(function (depositDetails) {
                notPermittedBitcoinAddresses[depositDetails.address] = 1;
            });
        }

        function withdrawEUR() {
            ctrl.sourceCurrency = Currency.EUR.displayName;
            dialogService.open('#withdraw-fiat-dialog');
        }

        function withdrawUSD() {
            ctrl.sourceCurrency = Currency.USD.displayName;
            dialogService.open('#withdraw-fiat-dialog');
        }

        function validateRecipientBTCAddress(recipient) {
            if (!recipient.match(/^[0-9a-z]{27,34}$/i)) {
                throw new Error('Bitcoin address is invalid. Expected address length is from 27 to 34 symbols');
            }

            if (notPermittedBitcoinAddresses[recipient]) {
                throw new Error('Withdraw on deposit bitcoin accounts is not permitted');
            }
        }

        function validateWithdrawCost(withdrawCost, availableFunds) {
            if (withdrawCost.greaterThan(availableFunds)) {
                throw new Error('Not enough Waves for the withdraw transfer');
            }
        }

        function confirmWithdraw (amountForm) {
            if (!amountForm.validate(ctrl.validationOptions)) {
                return false;
            }

            try {
                var withdrawCost = Money.fromTokens(ctrl.autocomplete.getFeeAmount(), Currency.WAVES);
                validateWithdrawCost(withdrawCost, ctrl.wavesBalance);
                if (ctrl.assetBalance.currency === Currency.BTC) {
                    validateRecipientBTCAddress(ctrl.recipient);
                } else if (ctrl.assetBalance.currency === Currency.ETH) {
                    // TODO
                }
            } catch (e) {
                notificationService.error(e.message);
                return false;
            }

            var total = Money.fromTokens(ctrl.total, ctrl.assetBalance.currency);
            var fee = Money.fromTokens(ctrl.autocomplete.getFeeAmount(), Currency.WAVES);
            ctrl.confirm.amount = total;
            ctrl.confirm.fee = fee;
            ctrl.confirm.recipient = ctrl.recipient;

            coinomatService.getWithdrawDetails(ctrl.assetBalance.currency, ctrl.recipient)
                .then(function (withdrawDetails) {
                    ctrl.confirm.gatewayAddress = withdrawDetails.address;

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
                    ctrl.broadcast.setTransaction(assetService.createAssetTransferTransaction(assetTransfer, sender));

                    resetForm();

                    dialogService.open('#withdraw-confirmation');
                })
                .catch(function (exception) {
                    notificationService.error(exception.message);
                });

            return true;
        }

        function broadcastTransaction () {
            ctrl.broadcast.broadcast();
        }

        function refreshTotal () {
            var amount = ctrl.exchangeRate * ctrl.amount;
            var total = Money.fromTokens(amount + ctrl.feeIn + ctrl.feeOut, ctrl.assetBalance.currency);
            ctrl.total = total.formatAmount(true, false);
        }

        function refreshAmount () {
            var total = Math.max(0, ctrl.exchangeRate * (ctrl.total - ctrl.feeIn) - ctrl.feeOut);
            var amount = Money.fromTokens(total, ctrl.assetBalance.currency);
            ctrl.amount = amount.formatAmount(true, false);
        }

        function resetForm () {
            ctrl.recipient = '';
            ctrl.address = '';
            ctrl.autocomplete.defaultFee(Number(DEFAULT_FEE_AMOUNT));
        }
    }

    WavesWalletWithdrawController.$inject = [
        '$scope', 'constants.ui', 'wallet.events', 'autocomplete.fees', 'dialogService', '$element',
        'coinomatService', 'transactionBroadcast', 'notificationService',
        'apiService', 'formattingService', 'assetService', 'applicationContext'
    ];

    angular
        .module('app.wallet')
        .controller('walletWithdrawController', WavesWalletWithdrawController);
})();
