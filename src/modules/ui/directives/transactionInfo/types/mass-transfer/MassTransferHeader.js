(function () {
    'use strict';

    /**
     * @param {app.utils} utils
     * @param {BaseAssetService} baseAssetService
     * @param {$rootScope.Scope} $scope
     * @return {MassTransferHeader}
     */
    const controller = function (utils, baseAssetService, $scope) {

        class MassTransferHeader {

            /**
             * @type {string}
             */
            typeName;
            /**
             * @type {Signable}
             */
            signable;
            /**
             * @type {string}
             */
            amount;
            /**
             * @type {string}
             */
            name;
            /**
             * @type {boolean}
             */
            needShowMirror = false;
            /**
             * @type {Money}
             */
            mirrorBalance;


            $postLink() {
                const tx = this.signable.getTxData();
                this.typeName = utils.getTransactionTypeName(tx);
                this.amount = tx.amount.toFormat();
                this.name = tx.amount.asset.name;

                if (tx.amount.asset.id !== baseAssetService.getBaseAssetId()) {
                    baseAssetService.convertToBaseAsset(tx.amount)
                        .then(mirror => {
                            this.mirrorBalance = mirror;
                            this.needShowMirror = this.mirrorBalance.getCoins().gt(0);
                            $scope.$apply();
                        });
                }
            }

        }

        return new MassTransferHeader();
    };

    controller.$inject = ['utils', 'baseAssetService', '$scope'];

    angular.module('app.ui').component('wMassTransferHeader', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/mass-transfer/header.html'
    });
})();
