(function () {
    'use strict';

    const { SIGN_TYPE } = require('@waves/signature-adapter');
    const { Money } = require('@waves/data-entities');
    const { BigNumber } = require('@waves/bignumber');

    /**
     * @param {Base} Base
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @param {User} user
     * @param {Waves} waves
     * @param {GatewayService} gatewayService
     */
    const controller = function (Base, $scope, utils, user, waves, gatewayService) {

        class GatewaySend extends Base {

            /**
             * @return {ISingleSendTx}
             */
            get tx() {
                return this.state.singleSend;
            }

            /**
             * @return {string}
             */
            get assetId() {
                return this.state.assetId;
            }

            /**
             * @return {string}
             */
            get mirrorId() {
                return this.state.mirrorId;
            }

            /**
             * @return {Object<string, Money>}
             */
            get moneyHash() {
                return this.state.moneyHash;
            }

            /**
             * @return {Money}
             */
            get balance() {
                return this.moneyHash[this.assetId];
            }

            /**
             * @return {IGatewayDetails|*|null}
             */
            get gatewayDetails() {
                return this.state.gatewayDetails;
            }

            set gatewayDetails(value) {
                this.state.gatewayDetails = value;
            }

            /**
             * @type {Function}
             */
            onSign = null;
            /**
             * @type {ISingleSendTx}
             */
            wavesTx = {
                type: SIGN_TYPE.TRANSFER,
                amount: null,
                attachment: '',
                fee: null,
                recipient: '',
                assetId: ''
            };
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
             * @type {Money | null}
             */
            mirror = null;
            /**
             * @type {string}
             */
            focus = '';
            /**
             * @type {boolean}
             */
            hasFee = true;
            /**
             * @type {Array}
             */
            feeList = [];
            /**
             * @type {Money}
             */
            minAmount = null;
            /**
             * @type {Money}
             */
            maxAmount = null;
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
                    this.receive(utils.observe(this.state, 'paymentId'), this._updateGatewayDetails, this);

                    this.observe('mirror', this._onChangeAmountMirror);
                    this.observe('gatewayDetails', this._onChangeGatewayDetails);

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

                this._updateGatewayDetails();
            }

            /**
             * @param {string} url
             * @return {null}
             */
            onReadQrCode(url) {
                if (!url.includes('https://')) {
                    this.tx.recipient = url;
                    $scope.$apply();
                    return null;
                }

                const routerData = utils.getRouterParams(utils.getUrlForRoute(url));

                if (!routerData || routerData.name !== 'SEND_ASSET') {
                    return null;
                }

                const result = routerData.data;

                this.tx.recipient = result.recipient;

                if (result) {

                    const applyAmount = () => {
                        if (result.amount) {
                            this.tx.amount = this.moneyHash[this.assetId].cloneWithTokens(result.amount);
                            this._fillMirror();
                        }
                        $scope.$apply();
                    };

                    result.assetId = result.asset || result.assetId;

                    if (result.assetId) {
                        waves.node.assets.balance(result.assetId).then(({ available }) => {
                            this.moneyHash[available.asset.id] = available;

                            if (this.assetId !== available.asset.id) {
                                const myAssetId = this.assetId;
                                this.assetId = available.asset.id;
                                this.canChooseAsset = true;
                                // TODO fix (hack for render asset avatar)
                                this.choosableMoneyList = [this.moneyHash[myAssetId], available];
                            }

                            applyAmount();
                        }, applyAmount);
                    } else {
                        applyAmount();
                    }
                }
            }

            /**
             * @return {boolean}
             */
            isMoneroNotIntegratedAddress() {
                const moneroAddressLength = 95;
                const assetIsMonero = this.assetId === WavesApp.defaultAssets.XMR;
                return assetIsMonero && this.tx.recipient.length === moneroAddressLength;
            }

            fillMax() {
                let amount = null;
                const moneyHash = utils.groupMoney(this.feeList);
                if (moneyHash[this.assetId]) {
                    amount = this.balance.sub(moneyHash[this.assetId]);
                } else {
                    amount = this.balance;
                }

                if (amount.getTokens().lt(0)) {
                    amount = this.balance.cloneWithTokens('0');
                }

                waves.utils.getRate(this.assetId, this.mirrorId).then(rate => {
                    this.mirror = amount.convertTo(this.moneyHash[this.mirrorId].asset, rate);
                    this.tx.amount = amount;
                    $scope.$apply();
                });
            }

            onBlurMirror() {
                if (!this.mirror) {
                    this._fillMirror();
                }
                this.focus = '';
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

            onSignTx(signable) {
                analytics.send({ name: 'Transfer Continue Click', target: 'ui' });
                this.onSign({ signable });
            }

            /**
             * @private
             */
            _updateGatewayDetails() {
                if (this.gatewayError) {
                    this.gatewayError = false;
                }
                if (this.gatewayDetailsError) {
                    this.gatewayDetailsError = false;
                }

                if (this.gatewayAddressError) {
                    this.gatewayAddressError = false;
                }

                if (this.gatewayWrongAddress) {
                    this.gatewayWrongAddress = false;
                }

                return gatewayService.getWithdrawDetails(this.balance.asset, this.tx.recipient, this.state.paymentId)
                    .then(details => {
                        const max = BigNumber.min(
                            details.maximumAmount.add(details.gatewayFee),
                            this.balance.getTokens()
                        );

                        this.gatewayDetails = details;
                        this.minAmount = this.balance.cloneWithTokens(details.minimumAmount);
                        this.maxAmount = this.balance.cloneWithTokens(max);
                        this.maxGatewayAmount = Money.fromTokens(details.maximumAmount, this.balance.asset);
                        $scope.$apply();
                    }, e => {
                        this.gatewayDetails = null;
                        if (e.message === gatewayService.getAddressErrorMessage(this.balance.asset,
                            this.tx.recipient, 'errorAddressMessage')) {
                            this.gatewayAddressError = true;
                        } else if (e.message === gatewayService.getWrongAddressMessage(this.balance.asset,
                            this.tx.recipient, 'wrongAddressMessage')) {
                            this.gatewayWrongAddress = true;
                        } else {
                            this.gatewayDetailsError = true;
                        }
                        $scope.$apply();
                    });
            }

            /**
             * @private
             */
            _onUpdateRecipient() {
                this.onChangeRecipient();
                this._updateGatewayDetails();
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
            _onChangeMirrorId() {
                if (!this.mirrorId) {
                    throw new Error('Has no asset id!');
                }

                if (!this.moneyHash[this.mirrorId]) {
                    return null;
                }

                this.mirror = this.balance.cloneWithTokens('0');
                this._onChangeAmount();
            }

            /**
             * @private
             */
            _onChangeAssetId() {
                if (!this.assetId) {
                    throw new Error('Has no asset id!');
                }

                if (!this.balance) {
                    return null;
                }

                this.tx.amount = this.balance.cloneWithTokens('0');
                this.mirror = this.moneyHash[this.mirrorId].cloneWithTokens('0');
            }

            /**
             * @private
             */
            _onChangeAmount() {
                if (this.focus === 'amount') {
                    this._fillMirror();
                }
            }

            /**
             * @private
             */
            _fillMirror() {
                if (!this.tx.amount) {
                    this.mirror = null;
                    return;
                }

                waves.utils.getRate(this.assetId, this.mirrorId).then(rate => {
                    this.mirror = this.tx.amount.convertTo(this.moneyHash[this.mirrorId].asset, rate);
                });
            }

            /**
             * @private
             */
            _fillAmount() {
                if (!this.mirror) {
                    this.tx.amount = null;
                    return null;
                }

                waves.utils.getRate(this.mirrorId, this.assetId).then(rate => {
                    this.tx.amount = this.mirror.convertTo(this.moneyHash[this.assetId].asset, rate);
                });
            }

            /**
             * @private
             */
            _onChangeAmountMirror() {
                if (this.focus === 'mirror') {
                    this._fillAmount();
                }
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
                } else {
                    this.feeList = [this.tx.fee];
                    check(this.feeList);
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
                    amount: this.tx.amount ? this.tx.amount.add(fee) : null,
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
                if (this.tx.amount.getTokens().gt(0)) {
                    this.gatewaySend.amount.$setTouched(true);
                }
            }

        }

        return new GatewaySend();
    };

    controller.$inject = [
        'Base',
        '$scope',
        'utils',
        'user',
        'waves',
        'gatewayService'
    ];

    angular.module('app.ui').component('wGatewaySend', {
        bindings: {
            state: '<',
            onSign: '&'
        },
        templateUrl: 'modules/utils/modals/sendAsset/components/singleSend/gatewaySend/gateway-send.html',
        transclude: true,
        controller
    });
})();
