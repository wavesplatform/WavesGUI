(function () {
    'use strict';

    /**
     * @param {app.utils} utils
     * @return {SetScriptAssetHeader}
     */
    const controller = function (utils) {

        class SetScriptAssetHeader {

            /**
             * @type {Signable}
             */
            signable;


            $postLink() {
                this.transaction = this.signable.getTxData();
                this.typeName = utils.getTransactionTypeName(this.transaction);
            }

        }

        return new SetScriptAssetHeader();
    };

    controller.$inject = ['utils'];

    angular.module('app.ui').component('wSetScriptAssetHeader', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/set-asset-script/header.html'
    });
})();
