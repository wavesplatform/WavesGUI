(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @param {IPollCreate} createPoll
     * @param {IOuterBlockchains} outerBlockchains
     * @param {User} user
     * @param {GatewayService} gatewayService
     * @param {Waves} waves
     */
    const controller = function (Base, $scope, utils, createPoll, waves, outerBlockchains, user, gatewayService) {

        class SingleSend extends Base {

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

            set assetId(id) {
                this.state.assetId = id;
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
             * @return {boolean}
             */
            get outerSendMode() {
                return this.state.outerSendMode;
            }

            set outerSendMode(value) {
                this.state.outerSendMode = value;
            }

            /**
             * @return {IGatewayDetails}
             */
            get gatewayDetails() {
                return this.state.gatewayDetails;
            }

            set gatewayDetails(value) {
                this.state.gatewayDetails = value;
            }

            constructor() {
                super();
                /**
                 * @type {Function}
                 */
                this.onContinue = null;
                /**
                 * @type {string}
                 */
                this.focus = null;
                /**
                 * @type {Money}
                 */
                this.mirror = null;
                /**
                 * @type {boolean}
                 */
                this.noMirror = false;
                /**
                 * @type {boolean}
                 */
                this.hasComission = true;
                /**
                 * @type {Array}
                 */
                this.feeList = null;
                /**
                 * @type {ISendState}
                 */
                this.state = Object.create(null);
                /**
                 * @type {boolean}
                 * @private
                 */
                this._noCurrentRate = false;
            }

            $postLink() {
                this.receiveOnce(utils.observe(this.state, 'moneyHash'), () => {
                    waves.node.getFee({ type: WavesApp.TRANSACTION_TYPES.NODE.TRANSFER }).then((fee) => {

                        this.observe('gatewayDetails', this._currentHasCommission);
                        this.receive(utils.observe(this.tx, 'fee'), this._currentHasCommission, this);

                        this.tx.fee = fee;
                        this.tx.amount = this.tx.amount || this.moneyHash[this.assetId].cloneWithTokens('0');
                        this._fillMirror();

                        this.receive(utils.observe(this.state, 'assetId'), this._onChangeAssetId, this);
                        this.receive(utils.observe(this.state, 'mirrorId'), this._onChangeMirrorId, this);

                        this.receive(utils.observe(this.tx, 'recipient'), this._updateGatewayDetails, this);
                        this.receive(utils.observe(this.tx, 'amount'), this._onChangeAmount, this);
                        this.observe('mirror', this._onChangeAmountMirror);

                        this._onChangeBaseAssets();
                        this._updateGatewayDetails();

                        if (this.tx.amount.getTokens().gt(0) || this.tx.recipient) {
                            this.send.$setSubmitted(true);
                        }
                    });
                });
            }

            createTx() {
                const toGateway = this.outerSendMode && this.gatewayDetails;

                const tx = {
                    ...this.tx,
                    recipient: toGateway ? this.gatewayDetails.address : this.tx.recipient,
                    attachment: toGateway ? this.gatewayDetails.attachment : this.tx.attachment
                };

                this.onContinue({ tx });
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
                    amount = this.moneyHash[this.assetId].cloneWithTokens('0');
                }

                waves.utils.getRate(this.assetId, this.mirrorId).then((rate) => {
                    this._noCurrentRate = true;
                    this.mirror = amount.convertTo(this.moneyHash[this.mirrorId].asset, rate);
                    this.tx.amount = amount;
                    this._noCurrentRate = false;
                });
            }

            onBlurMirror() {
                if (!this.mirror) {
                    this._fillMirror();
                }
                this.focus = '';
            }

            onReadQrCode(result) {
                this.tx.recipient = result.body;

                analytics.push('Send', 'Send.QrCodeRead', 'Send.QrCodeRead.Success');

                if (result.params) {

                    const applyAmount = () => {
                        if (result.params.amount) {
                            this.tx.amount = this.moneyHash[this.assetId].cloneWithCoins(result.params.amount);
                            this._fillMirror();
                        }
                        $scope.$apply();
                    };

                    result.params.assetId = result.params.asset || result.params.assetId;

                    if (result.params.assetId) {
                        waves.node.assets.balance(result.params.assetId).then(({ available }) => {
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
             * @private
             */
            _onChangeMirrorId() {
                if (!this.mirrorId) {
                    throw new Error('Has no asset id!');
                }

                this._onChangeBaseAssets();

                if (!this.moneyHash[this.mirrorId]) {
                    return null;
                }

                this.mirror = this.moneyHash[this.mirrorId].cloneWithTokens('0');
                this._onChangeAmount();
            }

            /**
             * @private
             */
            _onChangeAssetId() {
                if (!this.assetId) {
                    throw new Error('Has no asset id!');
                }

                this._onChangeBaseAssets();

                if (!this.moneyHash[this.assetId]) {
                    return null;
                }

                this.tx.amount = this.moneyHash[this.assetId].cloneWithTokens('0');
                this.mirror = this.moneyHash[this.mirrorId].cloneWithTokens('0');
                this._updateGatewayDetails();

                analytics.push('Send', 'Send.ChangeCurrency', this.assetId);
            }

            /**
             * @private
             */
            _currentHasCommission() {
                const details = this.gatewayDetails;

                const check = (feeList) => {
                    const feeHash = utils.groupMoney(feeList);
                    const balanceHash = this.moneyHash;

                    this.hasComission = Object.keys(feeHash).every((feeAssetId) => {
                        const fee = feeHash[feeAssetId];
                        return balanceHash[fee.asset.id] && balanceHash[fee.asset.id].gte(fee);
                    });
                };

                if (details) {
                    const gatewayFee = this.balance.cloneWithTokens(details.gatewayFee);
                    this.feeList = [this.tx.fee, gatewayFee];
                    check(this.feeList);
                } else {
                    this.feeList = [this.tx.fee];
                    check(this.feeList);
                }
            }

            /**
             * @private
             */
            _onChangeBaseAssets() {
                if (this.assetId === this.mirrorId) {
                    this.noMirror = true;
                } else {
                    waves.utils.getRate(this.assetId, this.mirrorId).then((rate) => {
                        this.noMirror = rate.eq(0);
                    });
                }
            }

            /**
             * @private
             */
            _onChangeAmount() {
                if (!this._noCurrentRate && !this.noMirror && this.tx.amount && this.focus === 'amount') {
                    this._fillMirror();
                }
            }

            /**
             * @private
             */
            _onChangeAmountMirror() {
                if (!this._noCurrentRate && this.mirror && this.focus === 'mirror') {
                    this._fillAmount();
                }
            }

            /**
             * @private
             */
            _fillMirror() {
                waves.utils.getRate(this.assetId, this.mirrorId).then((rate) => {
                    this.mirror = this.tx.amount.convertTo(this.moneyHash[this.mirrorId].asset, rate);
                    $scope.$digest();
                });
            }

            /**
             * @private
             */
            _fillAmount() {
                waves.utils.getRate(this.mirrorId, this.assetId).then((rate) => {
                    this.tx.amount = this.mirror.convertTo(this.moneyHash[this.assetId].asset, rate);
                    $scope.$digest();
                });
            }

            /**
             * @private
             */
            _updateGatewayDetails() {
                const outerChain = outerBlockchains[this.assetId];
                const isValidWavesAddress = waves.node.isValidAddress(this.tx.recipient);

                this.outerSendMode = !isValidWavesAddress && outerChain && outerChain.isValidAddress(this.tx.recipient);

                if (this.outerSendMode) {
                    gatewayService.getWithdrawDetails(this.balance.asset, this.tx.recipient).then((details) => {
                        this.gatewayDetails = details;
                        $scope.$digest();
                        // TODO : validate amount field for gateway minimumAmount and maximumAmount
                    });
                } else {
                    this.gatewayDetails = null;
                }
            }

        }

        return new SingleSend();
    };

    controller.$inject = [
        'Base',
        '$scope',
        'utils',
        'createPoll',
        'waves',
        'outerBlockchains',
        'user',
        'gatewayService'
    ];

    angular.module('app.ui').component('wSingleSend', {
        bindings: {
            state: '<',
            onContinue: '&'
        },
        templateUrl: 'modules/utils/modals/sendAsset/components/singleSend/single-send.html',
        transclude: true,
        controller
    });
})();

/**
 * @typedef {object} ISendTx
 * @property {Money} fee
 * @property {Money} amount
 * @property {string} recipient
 * @property {string} attachment
 */
