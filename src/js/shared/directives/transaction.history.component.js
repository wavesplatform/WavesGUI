(function () {
    'use strict';

    var DEFAULT_FEE_AMOUNT = 0.001;
    var FEE_CURRENCY = Currency.WAVES;
    var DEFAULT_ERROR_MESSAGE = 'The Internet connection is lost';

    // TODO : add the `exceptField` attribute or a list of all the needed fields.

    function WavesTransactionHistoryController($scope, events, constants, applicationContext, autocomplete,
                                               apiService, leasingRequestService, notificationService, dialogService) {
        var ctrl = this;
        var minimumFee = new Money(constants.MINIMUM_TRANSACTION_FEE, FEE_CURRENCY);

        ctrl.cancelLeasing = cancelLeasing;
        ctrl.confirm = {};
        ctrl.autocomplete = autocomplete;
        ctrl.validationOptions = {
            onfocusout: false,
            rules: {
                cancelFee: {
                    required: true,
                    decimal: Currency.WAVES.precision,
                    min: minimumFee.toTokens()
                }
            },
            messages: {
                cancelFee: {
                    required: 'Transaction fee is required',
                    decimal: 'Transaction fee must a number be with no more than ' +
                        minimumFee.currency.precision + ' digits after the decimal point (.)',
                    min: 'Transaction fee is too small. It should be greater or equal to ' +
                        minimumFee.formatAmount(true)
                }
            }
        };

        $scope.$on(events.LEASING_CANCEL, function (event, eventData) {
            ctrl.startLeasingTransaction = eventData.startLeasingTransaction;

            ctrl.confirm.recipient = ctrl.startLeasingTransaction.recipient;
            ctrl.confirm.amount = ctrl.startLeasingTransaction.formatted.amount;
            ctrl.confirm.asset = ctrl.startLeasingTransaction.formatted.asset;

            reset();

            dialogService.open('#cancel-leasing-confirmation');
        });

        function cancelLeasing (form) {
            if (!form.validate(ctrl.validationOptions)) {
                return false;
            }

            var fee = Money.fromTokens(ctrl.autocomplete.getFeeAmount(), FEE_CURRENCY);
            var cancelLeasing = {
                startLeasingTransactionId: ctrl.startLeasingTransaction.id,
                fee: fee
            };

            var sender = {
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            };

            var transaction = leasingRequestService.buildCancelLeasingRequest(cancelLeasing, sender);

            apiService.leasing.cancel(transaction)
                .then(function () {
                    notificationService.notice('Leasing transaction of ' +
                        ctrl.startLeasingTransaction.formatted.amount + ' ' +
                        ctrl.startLeasingTransaction.formatted.asset + ' has been cancelled.');
                })
                .catch(function (exception) {
                    if (exception) {
                        if (exception.data) {
                            notificationService.error(exception.data.message);
                        } else if (exception.message) {
                            notificationService.error(exception.message);
                        } else if (exception.statusText) {
                            notificationService.error(exception.statusText);
                        } else {
                            notificationService.error(DEFAULT_ERROR_MESSAGE);
                        }
                    } else {
                        notificationService.error(DEFAULT_ERROR_MESSAGE);
                    }

                    dialogService.close();
                });

            return true;
        }

        function reset () {
            ctrl.autocomplete.defaultFee(DEFAULT_FEE_AMOUNT);
        }
    }

    WavesTransactionHistoryController.$inject = ['$scope', 'ui.events', 'constants.ui', 'applicationContext',
        'autocomplete.fees', 'apiService', 'leasingRequestService', 'notificationService', 'dialogService'];

    angular
        .module('app.shared')
        .component('wavesTransactionHistory', {
            controller: WavesTransactionHistoryController,
            bindings: {
                heading: '@',
                transactions: '<',
                limitTo: '<'
            },
            templateUrl: 'shared/transaction.history.component'
        });
})();
