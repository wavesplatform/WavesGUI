(function () {
    'use strict';

    /**
     * @param {app.utils} utils
     * @param {BaseAssetService} baseAssetService
     * @param {$rootScope.Scope} $scope
     * @return {CancelLeaseHeader}
     */
    const controller = function (utils, baseAssetService, $scope) {

        class CancelLeaseHeader {

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

                if (this.transaction.lease.amount.asset.id !== baseAssetService.getBaseAssetId()) {
                    baseAssetService.convertToBaseAsset(this.transaction.lease.amount)
                        .then(mirror => {
                            this.mirrorBalance = mirror;
                            this.needShowMirror = this.mirrorBalance.getCoins().gt(0);
                            $scope.$apply();
                        });
                }
            }

        }

        return new CancelLeaseHeader();
    };

    controller.$inject = ['utils', 'baseAssetService', '$scope'];

    angular.module('app.ui').component('wCancelLeaseHeader', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/cancel-lease/header.html'
    });
})();
