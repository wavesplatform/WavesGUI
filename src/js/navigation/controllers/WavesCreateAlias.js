(function () {
    'use strict';

    const DEFAULT_FEE = Money.fromTokens(1, Currency.WAVES);
    const ALIAS_MINIMUM_LENGTH = 4;
    const ALIAS_MAXIMUM_LENGTH = 30;

    function WavesCreateAlias($scope, $timeout, events, applicationContext,
                              dialogService, notificationService,
                              transactionBroadcast, formattingService, aliasRequestService, apiService) {
        const ctrl = this;
        ctrl.fee = DEFAULT_FEE;
        ctrl.validationOptions = {
            onfocusout: false,
            rules: {
                aliasName: {
                    required: true,
                    minlength: ALIAS_MINIMUM_LENGTH,
                    maxlength: ALIAS_MAXIMUM_LENGTH
                }
            },
            messages: {
                aliasName: {
                    required: `Symbolic name is required`,
                    minlength: `Alias name is too short. Please enter at least ${ALIAS_MINIMUM_LENGTH} symbols`,
                    maxlength: `Alias name is too long. Please use no more than ${ALIAS_MAXIMUM_LENGTH} symbols`
                }
            }
        };

        ctrl.broadcast = new transactionBroadcast.instance(apiService.alias.create,
            ((transaction) => {
                const displayMessage = `Created alias '${transaction.alias}'` +
                    `<br/>Date: ${formattingService.formatTimestamp(transaction.timestamp)}`;
                notificationService.notice(displayMessage);
            }));

        ctrl.confirmCreateAlias = confirmCreateAlias;
        ctrl.broadcastTransaction = broadcastTransaction;

        $scope.$on(events.NAVIGATION_CREATE_ALIAS, () => {
            reset();
            dialogService.open(`#create-alias-dialog`);
        });

        function broadcastTransaction() {
            ctrl.broadcast.broadcast();
        }

        function confirmCreateAlias(form) {

            if (!form.validate(ctrl.validationOptions)) {
                return false;
            }

            const createAlias = {
                alias: ctrl.alias,
                fee: ctrl.fee
            };

            const sender = {
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            };

            // creating the transaction and waiting for confirmation
            ctrl.broadcast.setTransaction(aliasRequestService.buildCreateAliasRequest(createAlias, sender));

            // open confirmation dialog
            // doing it async because this method is called while another dialog is open
            $timeout(() => {
                dialogService.open(`#create-alias-confirmation`);
            }, 1);

            return true;
        }

        function reset() {
            ctrl.alias = ``;
        }
    }

    WavesCreateAlias.$inject = [
        `$scope`, `$timeout`, `navigation.events`, `applicationContext`,
        `dialogService`, `notificationService`, `transactionBroadcast`, `formattingService`, `aliasRequestService`,
        `apiService`
    ];

    angular
        .module(`app.navigation`)
        .controller(`createAliasController`, WavesCreateAlias);
})();
