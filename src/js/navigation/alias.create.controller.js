(function () {
    'use strict';

    var DEFAULT_FEE = Money.fromTokens(1, Currency.WAV);
    var ALIAS_MINIMUM_LENGTH = 4;
    var ALIAS_MAXIMUM_LENGTH = 30;

    function WavesCreateAliasController ($scope, $timeout, events, applicationContext,
                                         dialogService, notificationService,
                                         transactionBroadcast, formattingService, aliasRequestService, apiService) {
        var create = this;
        create.fee = DEFAULT_FEE;
        create.validationOptions = {
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
        create.broadcast = new transactionBroadcast.instance(apiService.alias.create,
            function (transaction, response) {
                var displayMessage = 'Created alias \'' + transaction.alias + '\'' +
                    '<br/>Date: ' + formattingService.formatTimestamp(transaction.timestamp);
                notificationService.notice(displayMessage);
            });
        create.confirmCreateAlias = confirmCreateAlias;
        create.broadcastTransaction = broadcastTransaction;

        $scope.$on(events.NAVIGATION_CREATE_ALIAS, function (event, eventData) {
            reset();

            dialogService.open('#create-alias-dialog');
        });

        function broadcastTransaction () {
            create.broadcast.broadcast();
        }

        function confirmCreateAlias (form) {
            if (!form.validate(create.validationOptions))
                return false;

            var createAlias = {
                alias: create.alias,
                fee: create.fee
            };

            var sender = {
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            };

            // creating the transaction and waiting for confirmation
            create.broadcast.setTransaction(aliasRequestService.buildCreateAliasRequest(createAlias, sender));

            // open confirmation dialog
            // doing it async because this method is called while another dialog is open
            $timeout(function () {
                dialogService.open('#create-alias-confirmation');
            }, 1);

            return true;
        }

        function reset () {
            create.alias = '';
        }
    }

    WavesCreateAliasController.$inject = ['$scope', '$timeout', 'navigation.events', 'applicationContext',
        'dialogService', 'notificationService', 'transactionBroadcast', 'formattingService', 'aliasRequestService',
        'apiService'];

    angular
        .module('app.navigation')
        .controller('createAliasController', WavesCreateAliasController);
})();
