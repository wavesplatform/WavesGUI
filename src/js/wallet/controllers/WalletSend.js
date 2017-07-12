(function () {
    'use strict';

    const DEFAULT_FEE_AMOUNT = `0.001`;
    const FEE_CURRENCY = Currency.WAVES;

    function WalletSend($scope, $timeout, constants, events, autocomplete, applicationContext,
                        apiService, dialogService, transactionBroadcast, assetService,
                        notificationService, formattingService, addressService) {

        const ctrl = this;
        const minimumFee = new Money(constants.MINIMUM_TRANSACTION_FEE, FEE_CURRENCY);

        ctrl.autocomplete = autocomplete;

        ctrl.validationOptions = {
            rules: {
                sendRecipient: {
                    required: true,
                    address: true
                },
                sendAmount: {
                    required: true,
                    decimal: 8, // stub value updated on validation
                    min: 0, // stub value updated on validation
                    max: constants.JAVA_MAX_LONG // stub value updated on validation
                },
                sendFee: {
                    required: true,
                    decimal: Currency.WAVES.precision,
                    min: minimumFee.toTokens()
                },
                sendAttachment: {
                    maxbytelength: constants.MAXIMUM_ATTACHMENT_BYTE_SIZE
                }
            },
            messages: {
                sendRecipient: {
                    required: `Recipient account number is required`
                },
                sendAmount: {
                    required: `Amount to send is required`
                },
                sendFee: {
                    required: `Transaction fee is required`,
                    decimal: `Transaction fee must be a number with no more than ${
                        minimumFee.currency.precision} digits after the decimal point (.)`,
                    min: `Transaction fee is too small. It should be greater or equal to ${
                        minimumFee.formatAmount(true)}`
                },
                sendAttachment: {
                    maxbytelength: `Attachment is too long`
                }
            }
        };

        ctrl.confirm = {
            recipient: ``
        };

        ctrl.broadcast = new transactionBroadcast.instance(apiService.assets.transfer,
            ((transaction) => {
                const amount = Money.fromCoins(transaction.amount, ctrl.assetBalance.currency);
                const address = transaction.recipient;
                const displayMessage = `Sent ${amount.formatAmount(true)} of ${
                    ctrl.assetBalance.currency.displayName
                }<br/>Recipient ${address.substr(0, 15)}...<br/>Date: ${
                    formattingService.formatTimestamp(transaction.timestamp)}`;
                notificationService.notice(displayMessage);
            }));

        ctrl.submitTransfer = submitTransfer;
        ctrl.broadcastTransaction = broadcastTransaction;

        resetForm();

        $scope.$on(events.WALLET_SEND, (event, eventData) => {

            resetForm();

            ctrl.feeAssetBalance = eventData.wavesBalance;
            ctrl.assetBalance = eventData.assetBalance;
            ctrl.feeAndTransferAssetsAreTheSame = eventData.assetBalance.currency === FEE_CURRENCY;
            ctrl.currency = eventData.assetBalance.currency.displayName;

            // update validation options and check how it affects form validation
            ctrl.validationOptions.rules.sendAmount.decimal = ctrl.assetBalance.currency.precision;
            const minimumPayment = Money.fromCoins(1, ctrl.assetBalance.currency);
            ctrl.validationOptions.rules.sendAmount.min = minimumPayment.toTokens();
            ctrl.validationOptions.rules.sendAmount.max = ctrl.assetBalance.toTokens();
            ctrl.validationOptions.messages.sendAmount.decimal = `${`The amount to send must be a number ` +
                `with no more than `}${minimumPayment.currency.precision
            } digits after the decimal point (.)`;
            ctrl.validationOptions.messages.sendAmount.min = `${`Payment amount is too small. ` +
                `It should be greater or equal to `}${minimumPayment.formatAmount(false)}`;
            ctrl.validationOptions.messages.sendAmount.max = `${`Payment amount is too big. ` +
                `It should be less or equal to `}${ctrl.assetBalance.formatAmount(false)}`;

            dialogService.open(`#wB-butSend-WAV`);
        });

        function submitTransfer(transferForm) {
            if (!transferForm.validate(ctrl.validationOptions)) {
                // prevent dialog from closing
                return false;
            }

            const amount = Money.fromTokens(ctrl.amount, ctrl.assetBalance.currency);
            const transferFee = Money.fromTokens(ctrl.autocomplete.getFeeAmount(), FEE_CURRENCY);
            let paymentCost = transferFee;
            if (ctrl.feeAndTransferAssetsAreTheSame) {
                paymentCost = paymentCost.plus(amount);
            }

            if (paymentCost.greaterThan(ctrl.feeAssetBalance)) {
                notificationService.error(`Not enough ${FEE_CURRENCY.displayName} for the transfer`);
                return false;
            }

            const assetTransfer = {
                recipient: addressService.cleanupOptionalPrefix(ctrl.recipient),
                amount: amount,
                fee: transferFee
            };

            if (ctrl.attachment) {
                assetTransfer.attachment = converters.stringToByteArray(ctrl.attachment);
            }

            const sender = {
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            };
            // creating the transaction and waiting for confirmation
            ctrl.broadcast.setTransaction(assetService.createAssetTransferTransaction(assetTransfer, sender));

            // setting data for the confirmation dialog
            ctrl.confirm.amount = assetTransfer.amount;
            ctrl.confirm.fee = assetTransfer.fee;
            ctrl.confirm.recipient = assetTransfer.recipient;

            // open confirmation dialog
            // doing it async because this method is called while another dialog is open
            $timeout(() => {
                dialogService.open(`#send-payment-confirmation`);
            }, 1);

            // it's ok to close payment dialog
            return true;
        }

        function broadcastTransaction() {
            ctrl.broadcast.broadcast();
        }

        function resetForm() {
            ctrl.recipient = ``;
            ctrl.amount = `0`;
            ctrl.confirm.amount = Money.fromTokens(0, Currency.WAVES);
            ctrl.confirm.fee = Money.fromTokens(DEFAULT_FEE_AMOUNT, FEE_CURRENCY);
            ctrl.autocomplete.defaultFee(Number(DEFAULT_FEE_AMOUNT));
        }
    }

    WalletSend.$inject = [
        `$scope`, `$timeout`, `constants.ui`, `wallet.events`, `autocomplete.fees`, `applicationContext`,
        `apiService`, `dialogService`, `transactionBroadcast`, `assetService`,
        `notificationService`, `formattingService`, `addressService`
    ];

    angular
        .module(`app.wallet`)
        .controller(`walletSendController`, WalletSend);
})();
