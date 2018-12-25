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


            $postLink() {
                this.transaction = this.signable.getTxData();
                this.signable.getId().then(id => {
                    this.id = id;
                    $scope.$apply();
                });
            }

        }

        return new DataInfo();
    };

    controller.$inject = ['$scope'];

    angular.module('app.ui').component('wDataInfo', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/data/data-info.html'
    });
})();
