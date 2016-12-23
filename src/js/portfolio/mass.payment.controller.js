(function () {
    'use strict';

    var MAXIMUM_FILE_SIZE = 1 * 1024 * 1024;
    var FIRST_TRANSACTIONS_COUNT = 10;
    var LOADING_STAGE = 'loading';
    var PROCESSING_STAGE = 'processing';
    var ZERO_MONEY = Money.fromTokens(0, Currency.WAV);

    function WavesMassPaymentController ($scope, $window, $timeout, constants, events, applicationContext, autocomplete,
                                         notificationService, assetService, dialogService) {
        var mass = this;
        var minimumFee = new Money(constants.MINIMUM_TRANSACTION_FEE, Currency.WAV);

        mass.summary = {
            totalAmount: ZERO_MONEY,
            totalFee: ZERO_MONEY
        };
        mass.transfers = [];
        mass.inputPayments = [];
        mass.autocomplete = autocomplete;
        mass.stage = LOADING_STAGE;
        mass.validationOptions = {
            rules: {
                massPayFee: {
                    required: true,
                    decimal: Currency.WAV.precision,
                    min: minimumFee.toTokens()
                }
            },
            messages: {
                massPayFee: {
                    required: 'Fee per transaction is required',
                    decimal: 'Fee must be with no more than ' +
                        minimumFee.currency.precision + ' digits after the decimal point (.)',
                    min: 'Fee per transaction is too small. It should be greater or equal to ' +
                        minimumFee.formatAmount(true)
                }
            }
        };
        mass.handleFile = handleFile;
        mass.loadInputFile = loadInputFile;
        mass.processInputFile = processInputFile;
        mass.submitPayment = submitPayment;
        mass.broadcastTransaction = broadcastTransaction;

        $scope.$on(events.ASSET_MASSPAY, function (event, eventData) {
            mass.wavesBalance = eventData.wavesBalance;
            if (eventData.assetId) {
                var asset = applicationContext.cache.assets[eventData.assetId];
                mass.availableBalance = asset.balance;
                mass.asset = asset;
            }
            else {
                mass.asset = undefined;
            }
            mass.stage = LOADING_STAGE;

            dialogService.open('#asset-mass-pay-dialog');
        });

        function fileErrorHandler(evt) {
            cleanup();

            switch (evt.target.error.code) {
                case evt.target.error.NOT_FOUND_ERR:
                    notificationService.error('File Not Found!');
                    break;
                case evt.target.error.NOT_READABLE_ERR:
                    notificationService.error('File is not readable');
                    break;
                case evt.target.error.ABORT_ERR:
                    break; // noop
                default:
                    notificationService.error('An error occurred reading this file.');
            }
        }

        function loadInputFile (content) {
            try {
                mass.inputPayments = [];
                mass.inputPayments = $window.JSON.parse(content);
            }
            catch (ex) {
                notificationService.error('Failed to parse file: ' + ex);
            }
        }

        function processInputFile(form) {
            if (!form.validate(mass.validationOptions)) {
                return;
            }

            if (!mass.inputPayments || mass.inputPayments.length === 0) {
                notificationService.error('Payments were not provided or failed to parse. Nothing to load');

                return;
            }

            var sender = {
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            };

            var transactions = [];
            var transfersToDisplay = [];
            var transferCurrency = mass.asset ? mass.asset.currency : Currency.WAV;
            var totalTransactions = 0;
            var totalAmount = Money.fromCoins(0, transferCurrency);
            var totalFee = Money.fromCoins(0, Currency.WAV);
            var fee = Money.fromTokens(mass.autocomplete.getFeeAmount(), Currency.WAV);
            _.forEach(mass.inputPayments, function (transfer) {
                var assetTransfer = {
                    recipient: transfer.recipient,
                    amount: Money.fromTokens(transfer.amount, transferCurrency),
                    fee: fee
                };

                if (transfersToDisplay.length < FIRST_TRANSACTIONS_COUNT)
                    transfersToDisplay.push({
                        recipient: transfer.recipient,
                        amount: assetTransfer.amount.toTokens()
                    });

                transactions.push(assetService.createAssetTransferTransaction(assetTransfer, sender));

                // statistics
                totalAmount = totalAmount.plus(assetTransfer.amount);
                totalFee = totalFee.plus(assetTransfer.fee);
                totalTransactions++;
            });

            mass.summary.totalAmount = totalAmount;
            mass.summary.totalTransactions = totalTransactions;
            mass.summary.totalFee = totalFee;
            mass.transfers = transfersToDisplay;
            mass.stage = PROCESSING_STAGE;
        }

        function submitPayment() {
            var paymentCost = mass.asset ?
                mass.summary.totalFee :
                mass.summary.totalFee.plus(mass.summary.totalAmount);

            if (paymentCost.greaterThan(mass.wavesBalance)) {
                notificationService.error('Not enough Waves to make mass payment');

                return false;
            }

            if (mass.asset && mass.summary.totalAmount.greaterThan(mass.asset.balance)) {
                notificationService.error('Not enough "' + mass.asset.currency.displayName + '" to make mass payment');

                return false;
            }

            //TODO: set transaction

            $timeout(function () {
                dialogService.open('#asset-mass-pay-confirmation');
            }, 1);

            return true;
        }

        function broadcastTransaction() {
            //TODO: broadcast transaction
        }

        function handleFile(file) {
            if (file.size > MAXIMUM_FILE_SIZE) {
                notificationService.error('File "' + file.name + '" is too big. Maximum file size is 1Mb.');

                return;
            }

            var reader = new $window.FileReader();

            reader.onloadend = function (event) {
                NProgress.done();

                if (event.target.readyState == FileReader.DONE)
                    mass.loadInputFile(event.target.result);
            };
            reader.onloadstart = function (event) {
                cleanup();
                NProgress.start();
            };
            reader.onabort = function (event) {
                notificationService.error('File read cancelled');
            };
            reader.onerror = fileErrorHandler;

            reader.readAsText(file);
        }

        function cleanup() {
            mass.summary.totalAmount = ZERO_MONEY;
            mass.summary.totalTransactions = 0;
            mass.summary.totalFee = ZERO_MONEY;
        }
    }

    WavesMassPaymentController.$inject = ['$scope', '$window', '$timeout', 'constants.ui', 'portfolio.events',
        'applicationContext', 'autocomplete.fees',
        'notificationService', 'assetService', 'dialogService'];

    angular
        .module('app.portfolio')
        .controller('massPaymentController', WavesMassPaymentController);
})();
