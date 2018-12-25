(function () {
    'use strict';

    /**
     * @param {$rootScope.Scope} $scope
     * @return {CreateAliasInfo}
     */
    const controller = function ($scope) {

        class CreateAliasInfo {

            /**
             * @type {Signable}
             */
            signable;
            /**
             * @type {boolean}
             */
            isLeaseIn = false;
            /**
             * @type {boolean}
             */
            isLeaseOut = false;
            /**
             * @type {string}
             */
            address = '';


            $postLink() {
                this.transaction = this.signable.getTxData();
                this.signable.getId().then(id => {
                    this.id = id;
                    $scope.$apply();
                });
            }

        }

        return new CreateAliasInfo();
    };

    controller.$inject = ['$scope'];

    angular.module('app.ui').component('wCreateAliasInfo', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/create-alias/create-alias-info.html'
    });
})();
