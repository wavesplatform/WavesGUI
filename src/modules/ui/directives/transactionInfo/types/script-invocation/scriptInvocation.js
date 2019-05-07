(function () {
    'use strict';

    /**
     * @param {$rootScope.Scope} $scope
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


            $postLink() {
                this.transaction = this.signable.getTxData();
                this.args = this.transaction.call.args;
                this.function = this.transaction.call.function;
                this.signable.getDataForApi().then(json => {
                    this.json = WavesApp.stringifyJSON(json, null, 4);
                });
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
