(function () {
    'use strict';

    var ADDRESS_STUB = 'n/a';

    function TransactionMenuController(notificationService) {
        var ctrl = this;

        ctrl.idCopied = idCopied;
        ctrl.dataCopied = dataCopied;
        ctrl.fullTransactionData = fullTransactionData;
        ctrl.hasRecipient = hasRecipient;
        ctrl.addressCopied = addressCopied;

        function addressCopied () {
            return notificationService.notice('Address has been copied');
        }

        function idCopied () {
            notificationService.notice('Transaction ID has been copied');
        }

        function dataCopied () {
            notificationService.notice('Full transaction data have been copied');
        }

        function hasRecipient () {
            return !!ctrl.transaction.recipient;
        }

        function fullTransactionData () {
            var recipient = hasRecipient() ? ctrl.transaction.recipient : ADDRESS_STUB;

            return 'TX ID: ' + ctrl.transaction.id +
                ' | TYPE: ' + ctrl.transaction.formatted.type +
                ' | DATE: ' + ctrl.transaction.formatted.datetime +
                ' | SENDER ADDRESS: ' + ctrl.transaction.sender +
                ' | TX AMOUNT: ' + ctrl.transaction.formatted.amount + ' ' + ctrl.transaction.formatted.asset +
                ' | RECIPIENT ADDRESS: ' + recipient +
                ' | TX FEE: ' + ctrl.transaction.formatted.fee;
        }
    }

    TransactionMenuController.$inject = ['notificationService'];

    angular
        .module('app.shared')
        .component('txMenu', {
            controller: TransactionMenuController,
            bindings: {
                transaction: '<'
            },
            template: '<md-menu>' +
                '<md-button class="md-icon-button" ng-click="$mdOpenMenu($event)">' +
                    '<img ng-src="img/wicon_txmenu.svg" height="16" width="16" />' +
                '</md-button>' +
                '<md-menu-content width="2">' +
                    '<md-menu-item>' +
                        '<md-button ngclipboard data-clipboard-text="{{::$ctrl.transaction.sender}}" ' +
                            'ngclipboard-success="$ctrl.addressCopied()">' +
                            '<span md-menu-align-target>Copy sender address</span>' +
                        '</md-button>' +
                    '</md-menu-item>' +
                    '<md-menu-item>' +
                        '<md-button ng-disabled="!$ctrl.hasRecipient()" ngclipboard ' +
                            'data-clipboard-text="{{::$ctrl.transaction.recipient}}" ' +
                            'ngclipboard-success="$ctrl.addressCopied()">' +
                            '<span md-menu-align-target>Copy recipient address</span>' +
                        '</md-button>' +
                    '</md-menu-item>' +
                    '<md-menu-item>' +
                        '<md-button ngclipboard data-clipboard-text="{{::$ctrl.transaction.id}}" ' +
                            'ngclipboard-success="$ctrl.idCopied()">' +
                            '<span md-menu-align-target>Copy TX ID</span>' +
                        '</md-button>' +
                    '</md-menu-item>' +
                    '<md-menu-item>' +
                        '<md-button ngclipboard ngclipboard-text-provider="$ctrl.fullTransactionData()" ' +
                            'ngclipboard-success="$ctrl.dataCopied()">' +
                            '<span md-menu-align-target>Copy full TX data</span>' +
                        '</md-button>' +
                    '</md-menu-item>' +
                '</md-menu-content>' +
            '</md-menu>'
        });
})();
