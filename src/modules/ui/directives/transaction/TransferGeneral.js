(function () {
    'use strict';

    /**
     * @param {User} user
     * @param {BaseAssetService} baseAssetService
     * @param {Waves} waves
     * @param {$rootScope.Scope} $scope
     * @return {TransferGeneral}
     */

    const controller = function (user, baseAssetService, waves, $scope) {

        class TransferGeneral {

            /**
             * {object}
             */
            props = null;

            $postLink() {
                this.typeName = this.props.typeName;
                this.subheaderParams = {
                    time: this.props.time,
                    address: this.props.shownAddress
                };

                const TYPES = waves.node.transactions.TYPES;

                switch (this.typeName) {
                    case TYPES.SPONSORSHIP_FEE:
                        this.sponsoredFee();
                        break;
                    default:
                        this.transfered();
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

            sponsoredFee() {
                this.assetName = this.getAssetName(this.props.fee.asset);
                this.amountParams = {
                    sign: '+',
                    amount: this.props.fee.toFormat(),
                    name: this.props.fee.asset.name
                };
            }

            transfered() {
                this.assetName = this.getAssetName(this.props.amount.asset);
                this.amountParams = {
                    amount: this.props.amount.toFormat(),
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

        }

        return new TransferGeneral();
    };

    controller.$inject = [
        'user',
        'baseAssetService',
        'waves',
        '$scope'
    ];

    angular.module('app.ui').component('wTransferGeneral', {
        bindings: {
            props: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/transfer-general.html',
        controller
    });
})();
