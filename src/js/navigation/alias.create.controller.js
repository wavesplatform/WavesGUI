(function () {
    'use strict';

    var DEFAULT_FEE = Money.fromTokens(0.001, Currency.WAVES);
    var ALIAS_MINIMUM_LENGTH = 4;
    var ALIAS_MAXIMUM_LENGTH = 30;

    function WavesCreateAliasController($scope, $timeout, events, applicationContext,
                                        dialogService, notificationService, transactionBroadcast,
                                        formattingService, aliasRequestService, apiService) {
        var ctrl = this;

        ctrl.fee = DEFAULT_FEE;
        ctrl.aliasList = null;

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
                    required: 'Symbolic name is required',
                    minlength: 'Alias name is too short. Please enter at least ' + ALIAS_MINIMUM_LENGTH + ' symbols',
                    maxlength: 'Alias name is too long. Please use no more than ' + ALIAS_MAXIMUM_LENGTH + ' symbols'
                }
            }
        };

        ctrl.broadcast = new transactionBroadcast.instance(apiService.alias.create, function (tx) {
            var formattedTime = formattingService.formatTimestamp(tx.timestamp),
                displayMessage = 'Created alias \'' + tx.alias + '\'<br/>Date: ' + formattedTime;
            notificationService.notice(displayMessage);
        });

        ctrl.confirmCreateAlias = confirmCreateAlias;
        ctrl.broadcastTransaction = broadcastTransaction;

        $scope.$on(events.NAVIGATION_CREATE_ALIAS, function () {
            reset();
            getExistingAliases();
            dialogService.open('#create-alias-dialog');
        });

        function getExistingAliases() {
            apiService.alias
                .getByAddress(applicationContext.account.address)
                .then(function (aliasList) {
                    ctrl.aliasList = aliasList;
                });
        }

        function broadcastTransaction () {
            ctrl.broadcast.broadcast();
        }

        function confirmCreateAlias (form) {
            if (!form.validate(ctrl.validationOptions)) {
                return false;
            }

            var createAlias = {
                alias: ctrl.alias,
                fee: ctrl.fee
            };

            var sender = {
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            };

            // Create the transaction and waiting for confirmation
            ctrl.broadcast.setTransaction(aliasRequestService.buildCreateAliasRequest(createAlias, sender));

            // Open confirmation dialog (async because this method is called while another dialog is open)
            $timeout(function () {
                dialogService.open('#create-alias-confirmation');
            }, 1);

            return true;
        }

        function reset () {
            ctrl.alias = '';
        }
    }

    WavesCreateAliasController.$inject = ['$scope', '$timeout', 'navigation.events', 'applicationContext',
                                          'dialogService', 'notificationService', 'transactionBroadcast',
                                          'formattingService', 'aliasRequestService', 'apiService'];

    angular
        .module('app.navigation')
        .controller('createAliasController', WavesCreateAliasController);
})();
