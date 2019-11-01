(function () {
    'use strict';

    const { Money } = require('@waves/data-entities');

    /**
     * @param {typeof Base} Base
     * @param {ng.IScope} $scope
     * @param {GatewayService} gatewayService
     * @param {User} user
     * @return {ReceiveCryptocurrency}
     */
    const controller = function (Base, $scope, gatewayService, user) {

        /**
         * @extends {ng.IController}
         */
        class ReceiveCryptocurrency extends Base {

            /**
             * @type {Asset}
             */
            asset = null;

            /**
             * @type {Array}
             */
            cryptocurrencies;

            /**
             * @type {boolean}
             */
            isSingleAsset;

            /**
             * @type {string}
             */
            assetKeyName;

            /**
             * @type {string}
             */
            gatewayAddress;

            /**
             * @type {boolean}
             */
            gatewayServerError = false;

            /**
             * @type {boolean}
             */
            gatewayServerPending = false;

            /**
             * @type {boolean}
             */
            isWEST;

            /**
             * @type {string}
             */
            chosenAssetId = null;

            /**
             * @type {Function}
             */
            onAssetChange;

            /**
             * @type {Money | null}
             */
            minAmount = null;

            /**
             * @type {Money | null}
             */
            maxAmount = null;

            constructor() {
                super();

                this.observe('chosenAssetId', ({ value: id }) => this.onAssetChange({ id }));

                this.observe('asset', this.updateGatewayAddress);
            }

            /**
             * @public
             */
            updateGatewayAddress() {
                this.gatewayServerError = false;
                this.gatewayServerPending = true;

                const depositDetails = gatewayService.getDepositDetails(this.asset, user.address);

                if (depositDetails) {
                    depositDetails.then((details) => {
                        this.gatewayAddress = details.address;
                        this.minAmount = Money.fromTokens(details.minimumAmount, this.asset);
                        this.maxAmount = Money.fromTokens(details.maximumAmount, this.asset);
                        this.gatewayServerPending = false;
                        $scope.$apply();
                    }, () => {
                        this.minAmount = Money.fromTokens(0.001, this.asset);
                        this.gatewayAddress = null;
                        this.gatewayServerError = true;
                        this.gatewayServerPending = false;
                        $scope.$apply();
                    });

                    this.assetKeyName = gatewayService.getAssetKeyName(this.asset, 'deposit');
                    this.isWEST = this.asset.id === WavesApp.defaultAssets.WEST;
                }
            }

        }

        return new ReceiveCryptocurrency();
    };

    controller.$inject = ['Base', '$scope', 'gatewayService', 'user'];

    angular.module('app.utils').component('wReceiveCryptocurrency', {
        controller,
        bindings: {
            asset: '<',
            cryptocurrencies: '<',
            isSingleAsset: '<',
            onAssetChange: '&'
        },
        templateUrl: 'modules/utils/modals/receive/receiveCryptocurrency/receive-cryptocurrency.html'
    });
})();
