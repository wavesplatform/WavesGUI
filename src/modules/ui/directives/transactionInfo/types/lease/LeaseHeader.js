(function () {
    'use strict';

    /**
     * @param {app.utils} utils
     * @param {BaseAssetService} baseAssetService
     * @param {$rootScope.Scope} $scope
     * @return {LeaseHeader}
     */
    const controller = function (utils, baseAssetService, $scope) {

        class LeaseHeader {

            /**
             * @type {Signable}
             */
            signable;
            /**
             * @type {Money}
             */
            mirrorBalance;
            /**
             * @type {boolean}
             */
            needShowMirror = false;


            $postLink() {
                this.transaction = this.signable.getTxData();
                this.typeName = utils.getTransactionTypeName(this.transaction);

                if (this.transaction.amount.asset.id !== baseAssetService.getBaseAssetId()) {
                    baseAssetService.convertToBaseAsset(this.transaction.amount)
                        .then(mirror => {
                            this.mirrorBalance = mirror;
                            this.needShowMirror = this.mirrorBalance.getCoins().gt(0);
                            $scope.$apply();
                        });
                }
            }

        }

        return new LeaseHeader();
    };

    controller.$inject = ['utils', 'baseAssetService', '$scope'];

    angular.module('app.ui').component('wLeaseHeader', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/lease/lease-header.html'
    });
})();
