(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {User} user
     * @param {BaseAssetService} baseAssetService
     * @param {Waves} waves
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @return {Transfer}
     */

    const controller = function (Base, user, baseAssetService, waves, $scope, utils) {

        class Transfer extends Base {

            /**
             * @type object
             */
            props = Object.create(null);

            $postLink() {
                this.typeName = this.props.typeName;
                this.time = this.props.time;
                this.address = this.props.shownAddress;

                this.receive(utils.observe(this.props, 'isScam'), () => {
                    this.isScam = this.props.isScam;
                    utils.safeApply($scope);
                });

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

        return new Transfer();
    };

    controller.$inject = [
        'Base',
        'user',
        'baseAssetService',
        'waves',
        '$scope',
        'utils'
    ];

    angular.module('app.ui').component('wTransferRow', {
        bindings: {
            props: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/types/transfer/transfer.html',
        controller
    });
})();
