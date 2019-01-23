(function () {
    'use strict';

    /**
     *
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @return {TransactionInfoCtrl}
     */
    const controller = function (Base, $scope) {

        class TransactionInfoCtrl extends Base {

            constructor() {
                super($scope);
                /**
                 * @type {Signable}
                 */
                this.signable = null;
            }

            $postLink() {
                if (!this.signable) {
                    throw new Error('Has no signable!');
                }
            }

        }

        return new TransactionInfoCtrl();
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.ui').component('wTransactionInfo', {
        bindings: {
            signable: '<',
            isConfirm: '<'
        },
        templateUrl: 'modules/ui/directives/transactionInfo/transaction-info.html',
        scope: false,
        controller
    });
})();
