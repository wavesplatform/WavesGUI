(function () {
    'use strict';

    /**
     * @param {app.utils} utils
     * @return {SetScriptHeader}
     */
    const controller = function (utils) {

        class SetScriptHeader {

            /**
             * @type {Signable}
             */
            signable;


            $postLink() {
                this.transaction = this.signable.getTxData();
                this.typeName = utils.getTransactionTypeName(this.transaction);
            }

        }

        return new SetScriptHeader();
    };

    controller.$inject = ['utils'];

    angular.module('app.ui').component('wSetScriptHeader', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/set-script/header.html'
    });
})();
