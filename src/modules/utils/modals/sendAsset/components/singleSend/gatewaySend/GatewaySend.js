(function () {
    'use strict';

    const { Money } = require('@waves/data-entities');
    const { BigNumber } = require('@waves/bignumber');

    /**
     * @param {SingleSend} SingleSend
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @param {User} user
     * @param {Waves} waves
     * @param {GatewayService} gatewayService
     * @param {ConfigService} configService
     */
    const controller = function (SingleSend, $scope, utils, user, waves, gatewayService, configService) {

        class GatewaySend extends SingleSend {

            /**
             * @return {IGatewayDetails|null}
             */
            get gatewayDetails() {
                return this.state.gatewayData.details;
            }

            /**
             * @return {string}
             */
            get paymentId() {
                return this.state.paymentId;
            }

            /**
             * @return {boolean}
             */
            get isGatewayAccepted() {
                return !configService
                    .get('PERMISSIONS.CANT_TRANSFER_GATEWAY').includes(this.balance.asset.id);
            }

            /**
             * @type {boolean}
             */
            gatewayError = false;
            /**
             * @type {boolean}
             */
            gatewayDetailsError = false;
            /**
             * @type {boolean}
             */
            gatewayAddressError = false;
            /**
             * @type {boolean}
             */
            gatewayWrongAddress = false;
            /**
             * @type {Money}
             */
            maxGatewayAmount = null;

            $postLink() {
                this.receive(utils.observe(this.tx, 'recipient'), this._onUpdateRecipient, this);
                this.observe(['gatewayAddressError', 'gatewayDetailsError', 'gatewayWrongAddress'],
                    this._updateGatewayError);

                const onHasMoneyHash = () => {

                    this.receive(utils.observe(this.tx, 'fee'), this._onChangeFee, this);
                    this.receive(utils.observe(this.tx, 'amount'), this._onChangeAmount, this);

                    this.receive(utils.observe(this.state, 'assetId'), this._onChangeAssetId, this);
                    this.receive(utils.observe(this.state, 'mirrorId'), this._onChangeMirrorId, this);
                    this.receive(utils.observe(this.state, 'paymentId'), this.updateGatewayData, this);
                    this.receive(utils.observe(this.state, 'gatewayData'), this._onUpdateGatewayData, this);

                    this.observe('mirror', this._onChangeAmountMirror);

                    this.receive(utils.observe(this.tx, 'amount'), this._updateWavesTxObject, this);
                    this.receive(utils.observe(this.tx, 'recipient'), this._updateWavesTxObject, this);

                    this._onChangeFee();
                    this._fillMirror();
                };

                if (!this.state.moneyHash) {
                    this.receiveOnce(utils.observe(this.state, 'moneyHash'), onHasMoneyHash);
                } else {
                    onHasMoneyHash();
                }

                this.receive(utils.observe(this.state, 'moneyHash'), () => {
                    this._onChangeFee();
                });

                $scope.$watch('$ctrl.gatewaySend.recipient', () => {
                    if (this.tx.recipient) {
                        this.gatewaySend.recipient.$$element.focus();
                    }
                });
            }

            /**
             * @return {boolean}
             */
            isMoneroNotIntegratedAddress() {
                const moneroAddressLength = 95;
                const assetIsMonero = this.assetId === WavesApp.defaultAssets.XMR;
                return assetIsMonero && this.tx.recipient.length === moneroAddressLength;
            }

            createTx() {
                const fee = this.tx.amount.cloneWithTokens(this.gatewayDetails.gatewayFee);
                const tx = waves.node.transactions.createTransaction({
                    ...this.tx,
                    recipient: this.gatewayDetails.address,
                    attachment: utils.stringToBytes(this.gatewayDetails.attachment),
                    amount: this.tx.amount.add(fee)
                });

                const signable = ds.signature.getSignatureApi().makeSignable({
                    type: tx.type,
                    data: tx
                });

                return signable;
            }

            /**
             * @private
             */
            _onUpdateGatewayData() {
                const { details, error } = this.state.gatewayData;

                if (details) {
                    this.gatewayDetailsError = false;
                    this.gatewayAddressError = false;
                    this.gatewayWrongAddress = false;

                    const max = BigNumber.min(
                        details.maximumAmount.add(details.gatewayFee),
                        this.balance.getTokens()
                    );

                    this.minAmount = this.balance.cloneWithTokens(details.minimumAmount);
                    this.maxAmount = this.balance.cloneWithTokens(max);
                    this.maxGatewayAmount = Money.fromTokens(details.maximumAmount, this.balance.asset);

                    this._onChangeGatewayDetails();
                } else if (error) {
                    if (error.message === gatewayService.getAddressErrorMessage(this.balance.asset,
                        this.tx.recipient, 'errorAddressMessage')) {
                        this.gatewayAddressError = true;
                    } else if (error.message === gatewayService.getWrongAddressMessage(this.balance.asset,
                        this.tx.recipient, 'wrongAddressMessage')) {
                        this.gatewayWrongAddress = true;
                    } else {
                        this.gatewayDetailsError = true;
                    }
                } else {
                    this.gatewayDetailsError = true;
                }

                $scope.$apply();
            }

            /**
             * @private
             */
            _onUpdateRecipient() {
                this.onChangeRecipient();
                this.updateGatewayData();
            }

            /**
             * @private
             */
            _updateGatewayError() {
                this.gatewayError = this.gatewayAddressError || this.gatewayDetailsError || this.gatewayWrongAddress;
            }

            /**
             * @private
             */
            _onChangeFee() {
                const details = this.gatewayDetails;

                const check = (feeList) => {
                    const feeHash = utils.groupMoney(feeList);
                    const balanceHash = this.moneyHash;

                    this.hasFee = Object.keys(feeHash).every((feeAssetId) => {
                        const fee = feeHash[feeAssetId];
                        return balanceHash[fee.asset.id] && balanceHash[fee.asset.id].gte(fee);
                    });
                };

                if (details) {
                    const gatewayFee = this.balance.cloneWithTokens(details.gatewayFee);
                    this.feeList = [this.tx.fee, gatewayFee];
                    check(this.feeList.concat(this.balance.cloneWithTokens(details.minimumAmount)));
                }
            }

            /**
             * @private
             */
            _updateWavesTxObject() {
                const fee = this.tx.amount ? this.tx.amount.cloneWithTokens(this.gatewayDetails.gatewayFee) : null;
                this.wavesTx = {
                    ...this.wavesTx,
                    recipient: this.gatewayDetails.address,
                    attachment: utils.stringToBytes(this.gatewayDetails.attachment),
                    amount: this.tx.amount.add(fee),
                    assetId: this.assetId
                };
            }

            /**
             * @private
             */
            _onChangeGatewayDetails() {
                this._updateWavesTxObject();
                this._onChangeFee();
                this._validateForm();
            }

            /**
             * @private
             */
            _validateForm() {
                if (this.tx.amount && this.tx.amount.getTokens().gt(0)) {
                    this.gatewaySend.amount.$setTouched(true);
                }
            }

            _onChangeAssetId() {
                super._onChangeAssetId();
                this.updateGatewayData();
            }

        }

        return new GatewaySend($scope);
    };

    controller.$inject = [
        'SingleSend',
        '$scope',
        'utils',
        'user',
        'waves',
        'gatewayService',
        'configService'
    ];

    angular.module('app.ui').component('wGatewaySend', {
        bindings: {
            state: '<',
            onSign: '&',
            onChangeRecipient: '&',
            updateGatewayData: '&'
        },
        templateUrl: 'modules/utils/modals/sendAsset/components/singleSend/gatewaySend/gateway-send.html',
        transclude: true,
        controller
    });
})();
