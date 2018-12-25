(function () {
    'use strict';

    /**
     * @param {$rootScope.Scope} $scope
     * @return {CancelLeaseInfo}
     */
    const controller = function ($scope) {

        class CancelLeaseInfo {

            /**
             * @type {Signable}
             */
            signable;


            $postLink() {
                this.transaction = this.signable.getTxData();

                this.signable.getId().then(id => {
                    this.id = id;
                    $scope.$apply();
                });
            }

        }

        return new CancelLeaseInfo();
    };

    controller.$inject = ['$scope'];

    angular.module('app.ui').component('wCancelLeaseInfo', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/cancel-lease/info.html'
    });
})();
