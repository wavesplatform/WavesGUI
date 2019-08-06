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
            gatewayServerError = false

            /**
             * @type {boolean}
             */
            isVostok;

            /**
             * @type {string}
             */
            chosenAssetId = null;

            /**
             * @type {Function}
             */
            onAssetChange;

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

                const depositDetails = gatewayService.getDepositDetails(this.asset, user.address);

                if (depositDetails) {
                    depositDetails.then((details) => {
                        this.gatewayAddress = details.address;
                        this.minAmount = Money.fromTokens(details.details.tunnel.in_min || 0.001, this.asset);
                        $scope.$apply();
                    }, () => {
                        this.minAmount = Money.fromTokens(0.001, this.asset);
                        this.gatewayAddress = null;
                        this.gatewayServerError = true;
                        $scope.$apply();
                    });

                    this.assetKeyName = gatewayService.getAssetKeyName(this.asset, 'deposit');
                    this.isVostok = this.asset.id === WavesApp.defaultAssets.VST;
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
