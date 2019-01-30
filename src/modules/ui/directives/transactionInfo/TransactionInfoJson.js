(function () {
    'use strict';

    const controller = function ($scope) {

        class TransactionInfoJson {

            /**
             * @type {string}
             */
            json = '';
            /**
             * @type {Signable}
             */
            signable = null;

            $postLink() {
                if (!this.signable) {
                    throw new Error('Has no signable!');
                }

                this.signable.getDataForApi().then(json => {
                    this.json = WavesApp.stringifyJSON(json, null, 4);
                    $scope.$apply();
                });
            }

            addAnalytic() {
                analytics.push(
                    'ConfirmTransaction',
                    `ConfirmTransaction.${this.signable.type}.CopyTransactionJSON`
                );
            }

        }

        return new TransactionInfoJson();
    };

    controller.$inject = ['$scope'];

    angular.module('app.ui').component('wTransactionInfoJson', {
        bindings: {
            signable: '<'
        },
        templateUrl: 'modules/ui/directives/transactionInfo/transaction-info-json.html',
        scope: false,
        controller
    });
})();
