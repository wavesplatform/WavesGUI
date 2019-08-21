(function () {
    'use strict';

    const FIAT_ASSETS = {
        [WavesApp.defaultAssets.USD]: true,
        [WavesApp.defaultAssets.EUR]: true
    };

    const ds = require('data-service');
    const { SIGN_TYPE } = require('@waves/signature-adapter');
    const analytics = require('@waves/event-sender');

    /**
     * @param {Base} Base
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @param {User} user
     * @param {Waves} waves
     * @param {IOuterBlockchains} outerBlockchains
     */
    const controller = function (Base,
                                 $scope,
                                 utils,
                                 waves,
                                 user,
                                 outerBlockchains) {

        class WavesSend extends Base {

            /**
             * @return {boolean}
             */
            get canSendToBank() {
                return FIAT_ASSETS[this.assetId] || false;
            }

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
             * @type {Function}
             */
            onSign = null;
            /**
             * @type {Function}
             */
            onChangeMode = null;
            /**
             * @type {string}
             */
            focus = '';
            /**
             * @type {Money | null}
             */
            mirror = null;
            /**
             * @type {boolean}
             */
            noMirror = false;
            /**
             * @type {boolean}
             */
            hasFee = true;
            /**
             * @type {Array}
             */
            feeList = [];
            /**
             * @type {Money | null}
             */
            minAmount = null;
            /**
             * @type {Money}
             */
            maxAmount = null;
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

            $postLink() {
                this.receive(utils.observe(this.tx, 'recipient'), this._onUpdateRecipient, this);

                const onHasMoneyHash = () => {
                    this.tx.amount = this.tx.amount || this.balance.cloneWithTokens('0');
                    this.receive(utils.observe(this.tx, 'fee'), this._onChangeFee, this);
                    this.receive(utils.observe(this.tx, 'amount'), this._onChangeAmount, this);

                    this.receive(utils.observe(this.state, 'assetId'), this._onChangeAssetId, this);
                    this.receive(utils.observe(this.state, 'mirrorId'), this._onChangeMirrorId, this);

                    this.observe('mirror', this._onChangeAmountMirror);

                    this.receive(utils.observe(this.tx, 'amount'), this._updateWavesTxObject, this);
                    this.receive(utils.observe(this.tx, 'recipient'), this._updateWavesTxObject, this);
                    this.receive(utils.observe(this.tx, 'attachment'), this._updateWavesTxObject, this);

                    this._onUpdateRecipient();
                    this._onChangeFee();
                    this._setMinAndMaxAmount();
                    this._onChangeBaseAssets();
                    this._updateWavesTxObject();
                    this._fillMirror();
                };

                if (!this.state.moneyHash) {
                    this.receiveOnce(utils.observe(this.state, 'moneyHash'), onHasMoneyHash);
                } else {
                    onHasMoneyHash();
                }

                this.receive(utils.observe(this.state, 'moneyHash'), () => {
                    this._onChangeFee();
                    this._setMinAndMaxAmount();
                    this._onChangeBaseAssets();
                });

            }

            setSendMode(mode) {
                this.onChangeMode({ mode });
            }

            /**
             * @return {Signable}
             */
            createTx() {
                const attachmentString = this.tx.attachment ? this.tx.attachment.toString() : '';
                const tx = waves.node.transactions.createTransaction({
                    ...this.tx,
                    attachment: utils.stringToBytes(attachmentString)
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
             * @private
             */
            _updateWavesTxObject() {
                const attachmentString = this.tx.attachment ? this.tx.attachment.toString() : '';
                const isWavesAddress = user.isValidAddress(this.tx.recipient);
                this.wavesTx = {
                    ...this.wavesTx,
                    recipient: isWavesAddress && this.tx.recipient || '',
                    attachment: utils.stringToBytes(attachmentString),
                    assetId: this.assetId
                };
            }

            /**
             * @private
             */
            _validateForm() {
                if (this.tx.amount.getTokens().gt(0) || this.tx.recipient) {
                    this.wavesSend.$setDirty(true);
                    this.wavesSend.$setSubmitted(true);
                    if (this.wavesSend.amount) {
                        this.wavesSend.amount.$setTouched(true);
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
            }

            /**
             * @private
             */
            _onChangeFee() {
                this.feeList = [this.tx.fee];

                const feeHash = utils.groupMoney(this.feeList);
                const balanceHash = this.moneyHash;

                this.hasFee = Object.keys(feeHash).every((feeAssetId) => {
                    const fee = feeHash[feeAssetId];
                    return balanceHash[fee.asset.id] && balanceHash[fee.asset.id].gte(fee);
                });

            }

            /**
             * @private
             */
            _onChangeBaseAssets() {
                if (this.assetId === this.mirrorId) {
                    this.noMirror = true;
                } else {
                    waves.utils.getRate(this.assetId, this.mirrorId).then(rate => {
                        this.noMirror = rate.eq(0);
                    });
                }
            }

            /**
             * @private
             */
            _setMinAndMaxAmount() {
                this.minAmount = this.balance.cloneWithTokens('0');
                this.maxAmount = this.balance;
            }

            /**
             * @private
             */
            _onChangeAmount() {
                if (!this.noMirror && this.focus === 'amount') {
                    this._fillMirror();
                }
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
            _onUpdateRecipient() {
                this._checkOuterBlockchains();
                this._validateForm();
            }

            /**
             * @private
             */
            _checkOuterBlockchains() {
                const outerChain = outerBlockchains[this.assetId];
                const isValidWavesAddress = user.isValidAddress(this.tx.recipient);
                const gatewayAddress = !isValidWavesAddress &&
                                        outerChain && outerChain.isValidAddress(this.tx.recipient);
                if (gatewayAddress) {
                    this.setSendMode('gateway');
                }
            }

        }

        return new WavesSend();
    };

    controller.$inject = [
        'Base',
        '$scope',
        'utils',
        'waves',
        'user',
        'outerBlockchains'
    ];

    angular.module('app.ui').component('wWavesSend', {
        bindings: {
            state: '<',
            onSign: '&',
            onChangeMode: '&'
        },
        templateUrl: 'modules/utils/modals/sendAsset/components/singleSend/wavesSend/waves-send.html',
        transclude: true,
        controller
    });
})();
