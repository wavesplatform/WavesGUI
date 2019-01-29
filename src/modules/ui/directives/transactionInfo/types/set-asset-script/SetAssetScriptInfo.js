(function () {
    'use strict';

    /**
     * @param {$rootScope.Scope} $scope
     * @return {SetAssetScriptInfo}
     */
    const controller = function ($scope) {

        class SetAssetScriptInfo {

            /**
             * @type {Signable}
             */
            signable;


            $postLink() {
                this.transaction = this.signable.getTxData();
                this.transaction.script = this.transaction.script || '';

                (this.transaction.id ? Promise.resolve(this.transaction.id) : this.signable.getId())
                    .then(id => {
                        this.id = id;
                        $scope.$apply();
                    });
            }

        }

        return new SetAssetScriptInfo();
    };

    controller.$inject = ['$scope'];

    angular.module('app.ui').component('wSetAssetScriptInfo', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/set-asset-script/info.html'
    });
})();
