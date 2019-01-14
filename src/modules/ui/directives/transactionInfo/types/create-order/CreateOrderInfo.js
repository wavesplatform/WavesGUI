(function () {
    'use strict';

    /**
     * @param {$rootScope.Scope} $scope
     * @return {CreateOrderInfo}
     */
    const controller = function ($scope) {

        class CreateOrderInfo {

            /**
             * @type {Signable}
             */
            signable;


            $postLink() {
                this.order = this.signable.getTxData();
                this.signable.getId().then(id => {
                    this.id = id;
                    $scope.$apply();
                });
            }

        }

        return new CreateOrderInfo();
    };

    controller.$inject = ['$scope'];

    angular.module('app.ui').component('wCreateOrderInfo', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/create-order/createOrder.html'
    });
})();
