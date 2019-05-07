(function () {
    'use strict';

    /**
     * @return {DataInfo}
     */
    const controller = function () {

        class DataInfo {

            /**
             * @type {Signable}
             */
            signable;
            /**
             * @type {boolean}
             */
            dataVisible = false;
            /**
             * @type {boolean}
             */
            allVisible = false;
            /**
             * @type {string}
             */
            function;
            /**
             * @type {string}
             */
            json;
            /**
             * @type {string}
             */
            payment;


            $postLink() {
                this.transaction = this.signable.getTxData();
                this.signable.getDataForApi().then(json => {
                    this.json = WavesApp.stringifyJSON(json, null, 4);
                });
                if (this.transaction.payment.length > 0) {
                    const payment = this.transaction.payment[0];
                    this.payment = `${payment.getTokens().toFormat()} ${payment.asset.displayName}`;
                }
            }

        }

        return new DataInfo();
    };

    angular.module('app.ui').component('wScriptInvocationInfo', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/script-invocation/script-invocation-info.html'
    });
})();
