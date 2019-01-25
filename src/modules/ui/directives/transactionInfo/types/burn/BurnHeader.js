(function () {
    'use strict';

    /**
     * @param {app.utils} utils
     * @return {BurnHeader}
     */
    const controller = function (utils) {

        class BurnHeader {

            /**
             * @type {Signable}
             */
            signable;


            $postLink() {
                this.transaction = this.signable.getTxData();
                this.quantity = this.transaction.amount.toFormat();
                this.name = this.transaction.amount.asset.name;
                this.typeName = utils.getTransactionTypeName(this.transaction);
            }

        }

        return new BurnHeader();
    };

    controller.$inject = ['utils'];

    angular.module('app.ui').component('wBurnHeader', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/burn/burn-header.html'
    });
})();
