(function () {
    'use strict';

    /**
     * @param {User} user
     * @param {BaseAssetService} baseAssetService
     * @param {$rootScope.Scope} $scope
     * @return {Transfer}
     */

    const controller = function (user, baseAssetService, $scope) {

        class Transfer {

            /**
             * {object}
             */
            props = null;

            $postLink() {
                this.typeName = this.props.typeName;
                this.assetName = this.getAssetName(this.props.amount.asset);
                this.subheaderParams = {
                    time: this.props.time,
                    address: this.props.shownAddress
                };
                this.amountParams = {
                    amount: this.props.formatedAmount,
                    name: this.props.amount.asset.name
                };
                if (this.props.amount && this.props.amount instanceof ds.wavesDataEntities.Money) {
                    baseAssetService.convertToBaseAsset(this.props.amount)
                        .then((baseMoney) => {
                            this.mirrorBalanceParams = {
                                amount: baseMoney.toFormat(),
                                name: baseMoney.asset.name
                            };
                            $scope.$digest();
                        });
                }
            }

            /**
             * @param {{id: string, name: string}} asset
             * @return {string}
             */
            getAssetName(asset) {
                try {
                    return !user.scam[asset.id] ? asset.name : '';
                } catch (e) {
                    return '';
                }
            }

        }

        return new Transfer();
    };

    controller.$inject = [
        'user',
        'baseAssetService',
        '$scope'
    ];

    angular.module('app.ui').component('wTransfer', {
        bindings: {
            props: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/types/transfer/transfer.html',
        controller
    });
})();
