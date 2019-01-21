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


            $postLink() {
                this.transaction = this.signable.getTxData();
                (this.transaction.id ? Promise.resolve(this.transaction.id) : this.signable.getId())
                    .then(id => {
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
