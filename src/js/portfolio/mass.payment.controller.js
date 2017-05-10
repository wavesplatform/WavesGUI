(function () {
    'use strict';

    var MAXIMUM_FILE_SIZE_BYTES = 256 * 1024;
    var MAXIMUM_TRANSACTIONS_PER_FILE = 500;
    var FIRST_TRANSACTIONS_COUNT = 10;
    var LOADING_STAGE = 'loading';
    var PROCESSING_STAGE = 'processing';
    var ZERO_MONEY = Money.fromTokens(0, Currency.WAVES);

    function ValidationError(message) {
        this.message = message;
    }

    function WavesMassPaymentController ($scope, $window, $timeout, constants, events, applicationContext, autocomplete,
                                         notificationService, assetService, dialogService,
                                         transactionBroadcast, apiService) {
        var mass = this;
        var minimumFee = new Money(constants.MINIMUM_TRANSACTION_FEE, Currency.WAVES);
        var transactions;

        mass.summary = {
            totalAmount: ZERO_MONEY,
            totalFee: ZERO_MONEY
        };
        mass.confirm = {
            recipients: 0
        };
        mass.filename = '';
        mass.transfers = [];
        mass.inputPayments = [];
        mass.autocomplete = autocomplete;
        mass.stage = LOADING_STAGE;
        mass.loadingInProgress = false;
        mass.broadcast = new transactionBroadcast.instance(apiService.assets.massPay,
            function (transaction, response) {
                var displayMessage = 'Sent ' + mass.summary.totalAmount.formatAmount(true) + ' of ' +
                        mass.summary.totalAmount.currency.displayName + ' to ' + mass.summary.totalTransactions +
                        ' recipients';
                notificationService.notice(displayMessage);
            });
        mass.validationOptions = {
            rules: {
                massPayFee: {
                    required: true,
                    decimal: Currency.WAVES.precision,
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
        mass.transactionsToClipboard = transactionsToClipboard;
        mass.dataCopied = dataCopied;
        mass.cancel = cancel;

        cleanup();

        $scope.$on(events.ASSET_MASSPAY, function (event, eventData) {
            mass.wavesBalance = eventData.wavesBalance;
            mass.assetBalance = eventData.wavesBalance;
            if (eventData.assetId) {
                mass.assetBalance = applicationContext.cache.assets[eventData.assetId].balance;
            }

            mass.sendingWaves = mass.assetBalance.currency === Currency.WAVES;

            cleanup();

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

        function loadInputFile (fileName, content) {
            try {
                mass.inputPayments = [];
                if (fileName.endsWith('.json')) {
                    mass.inputPayments = parseJsonFile(content);
                }
                else if (fileName.endsWith('.csv')) {
                    mass.inputPayments = parseCsvFile(content);
                }
                else {
                    throw new Error('Unsupported file type: ' + fileName);
                }
            }
            catch (ex) {
                notificationService.error('Failed to parse file: ' + ex);
            }
        }

        function parseCsvFile (content) {
            var lines = content.split('\n');
            var result = [];
            _.forEach(lines, function (line) {
                line = line.trim();
                if (line.length < 1)
                    return;

                var parts = line.split(';');
                if (parts.length < 2) {
                    throw new Error('CSV file contains ' + parts.length + ' columns. Expected 2 or 3 columns');
                }
                var address = parts[0];
                var amount = parseFloat(parts[1]);
                var id;
                if (parts.length > 2) {
                    id = parts[2];
                }

                result.push({
                    recipient: address,
                    amount: amount,
                    id: id
                });
            });

            return result;
        }

        function parseJsonFile (content) {
            return $window.JSON.parse(content);
        }

        function loadTransactionsFromFile() {
            var sender = {
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            };

            try {
                transactions = [];
                var transfersToDisplay = [];
                var transferCurrency = mass.assetBalance.currency;
                var totalTransactions = 0;
                var totalAmount = Money.fromCoins(0, transferCurrency);
                var totalFee = Money.fromCoins(0, Currency.WAVES);
                var fee = Money.fromTokens(mass.autocomplete.getFeeAmount(), Currency.WAVES);
                var minimumPayment = Money.fromCoins(1, transferCurrency);
                _.forEach(mass.inputPayments, function (transfer) {
                    if (isNaN(transfer.amount)) {
                        throw new ValidationError('Failed to parse payment amount for address ' + transfer.recipient);
                    }

                    var assetTransfer = {
                        recipient: transfer.recipient,
                        amount: Money.fromTokens(transfer.amount, transferCurrency),
                        fee: fee,
                        attachment: transfer.id ? converters.stringToByteArray(transfer.id) : undefined
                    };

                    if (assetTransfer.amount.lessThan(minimumPayment)) {
                        throw new ValidationError('Payment amount ' + transfer.amount + ' to address ' +
                            transfer.recipient + ' is less than minimum (' + minimumPayment.formatAmount(true) + ')');
                    }

                    if (transfersToDisplay.length < FIRST_TRANSACTIONS_COUNT)
                        transfersToDisplay.push({
                            recipient: transfer.recipient,
                            amount: assetTransfer.amount.formatAmount(true)
                        });

                    transactions.push(assetService.createAssetTransferTransaction(assetTransfer, sender));

                    // statistics
                    totalAmount = totalAmount.plus(assetTransfer.amount);
                    totalFee = totalFee.plus(assetTransfer.fee);
                    totalTransactions++;
                });

                mass.broadcast.setTransaction(transactions);

                mass.summary.totalAmount = totalAmount;
                mass.summary.totalTransactions = totalTransactions;
                mass.summary.totalFee = totalFee;
                mass.transfers = transfersToDisplay;
                mass.stage = PROCESSING_STAGE;

                // cleaning up
                mass.filename = '';
                mass.inputPayments = [];
            }
            catch (e) {
                if (e instanceof ValidationError) {
                    mass.invalidPayment = true;
                    mass.inputErrorMessage = e.message;
                }
                else {
                    throw e;
                }
            }

            mass.loadingInProgress = false;
        }

        function processInputFile(form) {
            if (!form.validate(mass.validationOptions)) {
                return;
            }

            if (!mass.inputPayments || mass.inputPayments.length === 0) {
                notificationService.error('Payments were not provided or failed to parse. Nothing to load');

                return;
            }

            if (mass.inputPayments.length > MAXIMUM_TRANSACTIONS_PER_FILE) {
                notificationService.error('Too many payments for a single file. Maximum payments count ' +
                    'in a file should not exceed ' + MAXIMUM_TRANSACTIONS_PER_FILE);

                return;
            }

            mass.loadingInProgress = true;
            // loading transactions asynchronously
            $timeout(loadTransactionsFromFile, 150);
        }

        function submitPayment() {
            var paymentCost = !mass.sendingWaves ?
                mass.summary.totalFee :
                mass.summary.totalFee.plus(mass.summary.totalAmount);

            if (paymentCost.greaterThan(mass.wavesBalance)) {
                notificationService.error('Not enough Waves to make mass payment');

                return false;
            }

            if (mass.summary.totalAmount.greaterThan(mass.assetBalance)) {
                notificationService.error('Not enough "' + mass.assetBalance.currency.displayName +
                    '" to make mass payment');

                return false;
            }

            // setting data for the confirmation dialog
            mass.confirm.amount = mass.summary.totalAmount;
            mass.confirm.fee = mass.summary.totalFee;
            mass.confirm.recipients = mass.summary.totalTransactions;

            dialogService.close();
            $timeout(function () {
                dialogService.open('#asset-mass-pay-confirmation');
            }, 1);

            return true;
        }

        function cancel () {
            dialogService.close();
        }

        function broadcastTransaction() {
            mass.broadcast.broadcast();
        }

        function handleFile(file) {
            if (file.size > MAXIMUM_FILE_SIZE_BYTES) {
                notificationService.error('File "' + file.name + '" is too big. Maximum file size is ' +
                    MAXIMUM_FILE_SIZE_BYTES / 1024 + 'Kb');

                return;
            }

            var reader = new $window.FileReader();

            reader.onloadend = function (event) {
                NProgress.done();

                if (event.target.readyState == FileReader.DONE)
                    mass.loadInputFile(file.name, event.target.result);
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

        function transactionsToClipboard() {
            return $window.JSON.stringify(transactions, null, ' ');
        }

        function dataCopied() {
            notificationService.notice('Transactions copied successfully');
        }

        function cleanup() {
            mass.summary.totalAmount = ZERO_MONEY;
            mass.summary.totalTransactions = 0;
            mass.summary.totalFee = ZERO_MONEY;
            mass.stage = LOADING_STAGE;
            mass.invalidPayment = false;

            mass.confirm.amount = Money.fromTokens(0, Currency.WAVES);
            mass.confirm.recipients = 0;
            mass.confirm.fee = Money.fromTokens(0, Currency.WAVES);

            mass.autocomplete.defaultFee(constants.MINIMUM_TRANSACTION_FEE);
        }
    }

    WavesMassPaymentController.$inject = ['$scope', '$window', '$timeout', 'constants.ui', 'portfolio.events',
        'applicationContext', 'autocomplete.fees',
        'notificationService', 'assetService', 'dialogService', 'transactionBroadcast', 'apiService'];

    angular
        .module('app.portfolio')
        .controller('massPaymentController', WavesMassPaymentController);
})();
