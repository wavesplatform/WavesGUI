(function () {
    'use strict';

    /**
     * @param {app.utils} utils
     * @param {BaseAssetService} baseAssetService
     * @param {$rootScope.Scope} $scope
     * @return {TransferHeader}
     */
    const controller = function (utils, baseAssetService, $scope) {

        class TransferHeader {

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
            /**
             * @type {boolean}
             */
            isSponsor = false;


            $postLink() {
                const tx = this.signable.getTxData();
                this.typeName = utils.getTransactionTypeName(tx);
                this.isSponsor = this.typeName === WavesApp.TRANSACTION_TYPES.EXTENDED.SPONSORSHIP_FEE;
                this.amount = this.isSponsor ? tx.fee.toFormat() : tx.amount.toFormat();
                this.name = this.isSponsor ? tx.fee.asset.name : tx.amount.asset.name;

                if (!this.isSponsor && tx.amount.asset.id !== baseAssetService.getBaseAssetId()) {
                    baseAssetService.convertToBaseAsset(tx.amount)
                        .then(mirror => {
                            this.mirrorBalance = mirror;
                            this.needShowMirror = this.mirrorBalance.getCoins().gt(0);
                            $scope.$apply();
                        });
                }
            }

        }

        return new TransferHeader();
    };

    controller.$inject = ['utils', 'baseAssetService', '$scope'];

    angular.module('app.ui').component('wTransferHeader', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/transfer/transfer-header.html'
    });
})();
