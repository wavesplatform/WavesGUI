(function () {
    'use strict';

    const { SIGN_TYPE } = require('@waves/signature-adapter');

    /**
     * @param {AssetSendFactory} AssetSendFactory
     * @param $scope
     * @param {app.utils} utils
     * @param {User} user
     * @param {IOuterBlockchains} outerBlockchains
     * @param {GatewayService} gatewayService
     * @return {WithdrawCtrl}
     */

    const controller = function (AssetSendFactory, $scope, utils, user, outerBlockchains, gatewayService) {

        class WithdrawCtrl extends AssetSendFactory {

            /**
             * @return {IGatewayDetails}
             */
            get gatewayDetails() {
                return this.state.gatewayData.details;
            }

            /**
             * @param {IAssetWithdrawCtrl.IOptions} options
             */
            constructor(options) {
                super(options, $scope);

                /**
                 * @type {IWithdrawState}
                 */
                this.state = {
                    assetId: options.assetId || WavesApp.defaultAssets.WAVES,
                    mirrorId: user.getSetting('baseAssetId'),
                    gatewayData: {
                        details: null,
                        error: null
                    },
                    paymentId: '',
                    moneyHash: null,
                    gatewaySend: utils.liteObject({ type: SIGN_TYPE.TRANSFER })
                };

                /**
                 * @type {boolean}
                 */
                this.isOuterBlockchainAddress = false;

                this._onChangeGatewayRecipient();
                this.receive(utils.observe(this.state.gatewaySend, 'recipient'), this._onChangeGatewayRecipient,
                    this);
            }

            updateGatewayData() {
                if (gatewayService.hasSupportOf(this.balance.asset, 'deposit') && this._isOuterBlockchains()) {
                    return gatewayService
                        .getWithdrawDetails(this.balance.asset, this.state.gatewaySend.recipient, this.state.paymentId)
                        .then(details => {
                            this.state.gatewayData = {
                                error: null,
                                details
                            };
                            utils.safeApply($scope);
                        }, error => {
                            this.state.gatewayData = {
                                details: null,
                                error
                            };
                            utils.safeApply($scope);
                        });
                } else {
                    this.state.gatewayData = {
                        error: null,
                        details: null
                    };
                    utils.safeApply($scope);
                }
            }

            /**
             * @return {boolean}
             * @private
             */
            _isOuterBlockchains() {
                const outerChain = outerBlockchains[this.state.assetId];
                const isValidWavesAddress = user.isValidAddress(this.state.gatewaySend.recipient);
                const isGatewayAddress = !isValidWavesAddress &&
                    outerChain && outerChain.isValidAddress(this.state.gatewaySend.recipient);
                return isGatewayAddress;
            }

            /**
             * @private
             */
            _onChangeGatewayRecipient() {
                this.isOuterBlockchainAddress = this._isOuterBlockchains();
                if (this._isOuterBlockchains()) {
                    this.updateGatewayData();
                } else {
                    this.gatewayData = {
                        details: null,
                        error: null
                    };
                }
            }

        }

        return new WithdrawCtrl(this.locals);
    };

    controller.$inject = [
        'AssetSendFactory',
        '$scope',
        'utils',
        'user',
        'outerBlockchains',
        'gatewayService'
    ];

    angular.module('app.utils')
        .controller('WithdrawCtrl', controller);
})();

/**
 * @typedef {object} IWithdrawState
 * @property {string} assetId
 * @property {string} mirrorId
 * @property {Object.<string, Money>} moneyHash
 * @property {ISingleSendTx} gatewaySend
 * @property {string} warning
 */

/**
 * @typedef {object} IAssetSendCtrl#IOptions & @property {'gateway'} [mode]
 */
