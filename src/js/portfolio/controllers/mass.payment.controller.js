(function () {
    'use strict';

    const MAXIMUM_FILE_SIZE_BYTES = 256 * 1024;
    const MAXIMUM_TRANSACTIONS_PER_FILE = 500;
    const FIRST_TRANSACTIONS_COUNT = 10;
    const LOADING_STAGE = 'loading';
    const PROCESSING_STAGE = 'processing';
    const ZERO_MONEY = Money.fromTokens(0, Currency.WAVES);

    function ValidationError(message) {
        this.message = message;
    }

    function WavesMassPaymentController($scope, $window, $timeout, constants, events, applicationContext,
                                        autocomplete, notificationService, assetService, dialogService,
                                        transactionBroadcast, apiService) {

        const ctrl = this;
        var minimumFee = new Money(constants.MINIMUM_TRANSACTION_FEE, Currency.WAVES);
        var transactions;

        ctrl.summary = {
            totalAmount: ZERO_MONEY,
            totalFee: ZERO_MONEY
        };
        ctrl.confirm = {
            recipients: 0
        };
        ctrl.filename = '';
        ctrl.transfers = [];
        ctrl.inputPayments = [];
        ctrl.autocomplete = autocomplete;
        ctrl.stage = LOADING_STAGE;
        ctrl.loadingInProgress = false;
        ctrl.broadcast = new transactionBroadcast.instance(apiService.assets.massPay,
            function () {
                var displayMessage = 'Sent ' + ctrl.summary.totalAmount.formatAmount(true) + ' of ' +
                    ctrl.summary.totalAmount.currency.displayName + ' to ' + ctrl.summary.totalTransactions +
                    ' recipients';
                notificationService.notice(displayMessage);
            });
        ctrl.validationOptions = {
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
        ctrl.handleFile = handleFile;
        ctrl.loadInputFile = loadInputFile;
        ctrl.processInputFile = processInputFile;
        ctrl.submitPayment = submitPayment;
        ctrl.broadcastTransaction = broadcastTransaction;
        ctrl.transactionsToClipboard = transactionsToClipboard;
        ctrl.dataCopied = dataCopied;
        ctrl.cancel = cancel;

        cleanup();

        $scope.$on(events.ASSET_MASSPAY, function (event, eventData) {
            ctrl.wavesBalance = eventData.wavesBalance;
            ctrl.assetBalance = eventData.wavesBalance;
            if (eventData.assetId) {
                ctrl.assetBalance = applicationContext.cache.assets[eventData.assetId].balance;
            }

            ctrl.sendingWaves = ctrl.assetBalance.currency === Currency.WAVES;

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

        function loadInputFile(fileName, content) {
            try {
                ctrl.inputPayments = [];
                if (fileName.endsWith('.json')) {
                    ctrl.inputPayments = parseJsonFile(content);
                } else if (fileName.endsWith('.csv')) {
                    ctrl.inputPayments = parseCsvFile(content);
                } else {
                    throw new Error('Unsupported file type: ' + fileName);
                }
            } catch (e) {
                notificationService.error('Failed to parse file: ' + e);
            }
        }

        function parseCsvFile(content) {
            var lines = content.split('\n');
            var result = [];
            _.forEach(lines, function (line) {
                line = line.trim();
                if (line.length < 1) {
                    return;
                }

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

        function parseJsonFile(content) {
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
                var transferCurrency = ctrl.assetBalance.currency;
                var totalTransactions = 0;
                var totalAmount = Money.fromCoins(0, transferCurrency);
                var totalFee = Money.fromCoins(0, Currency.WAVES);
                var fee = Money.fromTokens(ctrl.autocomplete.getFeeAmount(), Currency.WAVES);
                var minimumPayment = Money.fromCoins(1, transferCurrency);
                _.forEach(ctrl.inputPayments, function (transfer) {
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

                    if (transfersToDisplay.length < FIRST_TRANSACTIONS_COUNT) {
                        transfersToDisplay.push({
                            recipient: transfer.recipient,
                            amount: assetTransfer.amount.formatAmount(true)
                        });
                    }

                    transactions.push(assetService.createAssetTransferTransaction(assetTransfer, sender));

                    // statistics
                    totalAmount = totalAmount.plus(assetTransfer.amount);
                    totalFee = totalFee.plus(assetTransfer.fee);
                    totalTransactions++;
                });

                ctrl.broadcast.setTransaction(transactions);

                ctrl.summary.totalAmount = totalAmount;
                ctrl.summary.totalTransactions = totalTransactions;
                ctrl.summary.totalFee = totalFee;
                ctrl.transfers = transfersToDisplay;
                ctrl.stage = PROCESSING_STAGE;

                // cleaning up
                ctrl.filename = '';
                ctrl.inputPayments = [];
            }
            catch (e) {
                if (e instanceof ValidationError) {
                    ctrl.invalidPayment = true;
                    ctrl.inputErrorMessage = e.message;
                }
                else {
                    throw e;
                }
            }

            ctrl.loadingInProgress = false;
        }

        function processInputFile(form) {
            if (!form.validate(ctrl.validationOptions)) {
                return;
            }

            if (!ctrl.inputPayments || ctrl.inputPayments.length === 0) {
                notificationService.error('Payments were not provided or failed to parse. Nothing to load');

                return;
            }

            if (ctrl.inputPayments.length > MAXIMUM_TRANSACTIONS_PER_FILE) {
                notificationService.error('Too many payments for a single file. Maximum payments count ' +
                    'in a file should not exceed ' + MAXIMUM_TRANSACTIONS_PER_FILE);

                return;
            }

            ctrl.loadingInProgress = true;
            // loading transactions asynchronously
            $timeout(loadTransactionsFromFile, 150);
        }

        function submitPayment() {
            var paymentCost = !ctrl.sendingWaves ?
                ctrl.summary.totalFee :
                ctrl.summary.totalFee.plus(ctrl.summary.totalAmount);

            if (paymentCost.greaterThan(ctrl.wavesBalance)) {
                notificationService.error('Not enough Waves to make mass payment');

                return false;
            }

            if (ctrl.summary.totalAmount.greaterThan(ctrl.assetBalance)) {
                notificationService.error('Not enough "' + ctrl.assetBalance.currency.displayName +
                    '" to make mass payment');

                return false;
            }

            // setting data for the confirmation dialog
            ctrl.confirm.amount = ctrl.summary.totalAmount;
            ctrl.confirm.fee = ctrl.summary.totalFee;
            ctrl.confirm.recipients = ctrl.summary.totalTransactions;

            dialogService.close();
            $timeout(function () {
                dialogService.open('#asset-mass-pay-confirmation');
            }, 1);

            return true;
        }

        function cancel() {
            dialogService.close();
        }

        function broadcastTransaction() {
            ctrl.broadcast.broadcast();
        }

        function handleFile(file) {
            if (file.size > MAXIMUM_FILE_SIZE_BYTES) {
                notificationService.error('File "' + file.name + '" is too big. Maximum file size is ' +
                    MAXIMUM_FILE_SIZE_BYTES / 1024 + 'Kb');

                return;
            }

            var reader = new $window.FileReader();

            reader.onloadend = function (event) {
                if (event.target.readyState == FileReader.DONE) {
                    ctrl.loadInputFile(file.name, event.target.result);
                }
            };
            reader.onloadstart = function () {
                cleanup();
            };
            reader.onabort = function () {
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
            ctrl.summary.totalAmount = ZERO_MONEY;
            ctrl.summary.totalTransactions = 0;
            ctrl.summary.totalFee = ZERO_MONEY;
            ctrl.stage = LOADING_STAGE;
            ctrl.invalidPayment = false;

            ctrl.confirm.amount = Money.fromTokens(0, Currency.WAVES);
            ctrl.confirm.recipients = 0;
            ctrl.confirm.fee = Money.fromTokens(0, Currency.WAVES);

            ctrl.autocomplete.defaultFee(constants.MINIMUM_TRANSACTION_FEE);
        }
    }

    WavesMassPaymentController.$inject = [
        '$scope', '$window', '$timeout', 'constants.ui', 'portfolio.events', 'applicationContext',
        'autocomplete.fees', 'notificationService', 'assetService', 'dialogService',
        'transactionBroadcast', 'apiService'
    ];

    angular
        .module('app.portfolio')
        .controller('massPaymentController', WavesMassPaymentController);
})();
