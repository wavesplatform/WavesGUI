(function () {
    'use strict';

    /**
     * @param {$rootScope.Scope} $scope
     * @return {DataInfo}
     */
    const controller = function ($scope) {

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


            $postLink() {
                this.transaction = this.signable.getTxData();
                this.args = this.transaction.call.args;
                this.function = this.transaction.call.function;
                (this.transaction.id ? Promise.resolve(this.transaction.id) : this.signable.getId())
                    .then(id => {
                        this.id = id;
                        $scope.$apply();
                    });
            }

        }

        return new DataInfo();
    };

    controller.$inject = ['$scope'];

    angular.module('app.ui').component('wScriptInvocationInfo', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/script-invocation/script-invocation-info.html'
    });
})();
