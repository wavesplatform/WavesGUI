(function () {
    'use strict';

    /**
     * @param {app.utils} utils
     * @return {ReissueHeader}
     */
    const controller = function (utils) {

        class ReissueHeader {

            /**
             * @type {Signable}
             */
            signable;


            $postLink() {
                this.transaction = this.signable.getTxData();
                this.quantity = this.transaction.quantity.toFormat(this.transaction.precision);
                this.name = this.transaction.quantity.asset.name;
                this.typeName = utils.getTransactionTypeName(this.transaction);
            }

        }

        return new ReissueHeader();
    };

    controller.$inject = ['utils'];

    angular.module('app.ui').component('wReissueHeader', {
        bindings: {
            signable: '<',
            isScam: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/reissue/reissue-header.html'
    });
})();
