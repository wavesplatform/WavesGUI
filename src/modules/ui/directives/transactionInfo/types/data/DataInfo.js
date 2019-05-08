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
            isShowAllFields = false;


            $postLink() {
                this.transaction = this.signable.getTxData();
                (this.transaction.id ? Promise.resolve(this.transaction.id) : this.signable.getId())
                    .then(id => {
                        this.id = id;
                        $scope.$apply();
                    });
            }

            getShownFields() {
                return this.isShowAllFields ? this.transaction.data : this.transaction.data.slice(0, 3);
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
