(function () {
    'use strict';

    /**
     * @param {$rootScope.Scope} $scope
     * @return {SponsorshipInfo}
     */
    const controller = function ($scope) {

        class SponsorshipInfo {

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

        return new SponsorshipInfo();
    };

    controller.$inject = ['$scope'];

    angular.module('app.ui').component('wSponsorshipInfo', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/sponsorship/info.html'
    });
})();
