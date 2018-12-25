(function () {
    'use strict';

    /**
     * @param {$rootScope.Scope} $scope
     * @return {IssueInfo}
     */
    const controller = function ($scope) {

        class IssueInfo {

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

        return new IssueInfo();
    };

    controller.$inject = ['$scope'];

    angular.module('app.ui').component('wIssueInfo', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/issue/issue-info.html'
    });
})();
