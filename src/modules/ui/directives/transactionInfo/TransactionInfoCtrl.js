(function () {
    'use strict';

    /**
     *
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @return {TransactionInfoCtrl}
     */
    const controller = function (Base, $scope) {

        const { SIGN_TYPE } = require('@waves/signature-adapter');

        class TransactionInfoCtrl extends Base {

            constructor() {
                super($scope);
                /**
                 * @type {boolean}
                 */
                this.isTockenIssue = false;
                /**
                 * @type {Signable}
                 */
                this.signable = null;
            }

            $postLink() {
                if (!this.signable) {
                    throw new Error('Has no signable!');
                }

                const { type } = this.signable.getTxData();
                this.isTockenIssue = type === SIGN_TYPE.ISSUE;
            }

        }

        return new TransactionInfoCtrl();
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.ui').component('wTransactionInfo', {
        bindings: {
            signable: '<'
        },
        templateUrl: 'modules/ui/directives/transactionInfo/transaction-info.html',
        scope: false,
        controller
    });
})();
