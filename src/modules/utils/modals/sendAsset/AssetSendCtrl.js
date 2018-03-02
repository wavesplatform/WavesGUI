(function () {
    'use strict';

    /**
     * @param $scope
     * @param {Waves} waves
     * @param {Base} Base
     * @param {app.utils} utils
     * @param {User} user
     * @param {function} createPoll
     * @param outerBlockchains
     * @param {GatewayService} gatewayService
     * @return {AssetSendCtrl}
     */
    const controller = function ($scope, waves, Base, utils, user, createPoll, outerBlockchains, gatewayService) {

        class AssetSendCtrl extends Base {

            /**
             * @return {Money}
             */
            get balance() {
                return this.moneyHash && this.moneyHash[this.assetId];
            }

            /**
             * @param {string} assetId
             * @param {boolean} canChooseAsset
             */
            constructor(assetId, canChooseAsset) {
                super($scope);

                /**
                 * @type {ISendTx}
                 */
                this.tx = {
                    amount: null,
                    fee: null,
                    recipient: '',
                    attachment: ''
                };
                /**
                 * @type {{BTC: string, USD: string, LTC: string, ETH: string, WAVES: string, EUR: string, ZEC: string}}
                 */
                this.defaultAssets = WavesApp.defaultAssets;
                /**
                 * @type {Array<Money>}
                 */
                this.choosableMoneyList = [];
                /**
                 * @type {string}
                 */
                this.focus = null;
                /**
                 * @type {string}
                 */
                this.mirrorId = null;
                /**
                 * @type {Money}
                 */
                this.mirror = null;
                /**
                 * @type {number}
                 */
                this.step = 0;
                /**
                 * @type {boolean}
                 */
                this.canChooseAsset = !assetId || canChooseAsset;
                /**
                 * @type {string}
                 */
                this.assetId = assetId || WavesApp.defaultAssets.WAVES;
                /**
                 * @type {boolean}
                 */
                this.noMirror = false;
                /**
                 * @type {boolean}
                 */
                this.outerSendMode = false;
                /**
                 * @type {string}
                 */
                this.assetKeyName = '';
                /**
                 * @type {object}
                 */
                this.gatewayDetails = null;
                /**
                 * @type {boolean}
                 */
                this.hasComission = true;
                /**
                 * @type {Array}
                 */
                this.feeList = null;
                /**
                 * @type {Object.<string, Money>}
                 */
                this.moneyHash = null;
                /**
                 * @type {boolean}
                 * @private
                 */
                this._noCurrentRate = false;
                /**
                 * @type {boolean}
                 */
                this.gatewayError = false;

                this.syncSettings({
                    mirrorId: 'baseAssetId'
                });

                this.observe('moneyHash', this._onChangeMoneyHash);

                /**
                 * @type {Poll}
                 */
                this.poll = createPoll(this, this._getBalanceList, 'moneyHash', 1000, { isBalance: true });

                utils.whenAll([
                    waves.node.assets.fee('transfer'),
                    this.poll.ready
                ]).then(([[fee]]) => {

                    this.observe('gatewayDetails', this._currentHasCommission);
                    this.receive(utils.observe(this.tx, 'fee'), this._currentHasCommission, this);

                    this.tx.fee = fee;
                    this.tx.amount = this.moneyHash[this.assetId].cloneWithTokens('0');
                    this.mirror = this.moneyHash[this.mirrorId].cloneWithTokens('0');

                    this.observe('assetId', this._onChangeAssetId);
                    this.observe('mirrorId', this._onChangeMirrorId);
                    this.observe(['assetId', 'mirrorId'], () => this.poll.restart());
                    this.receive(utils.observe(this.tx, 'recipient'), this._updateGatewayDetails, this);
                    this.receive(utils.observe(this.tx, 'amount'), this._onChangeAmount, this);
                    this.observe('mirror', this._onChangeAmountMirror);

                    this._onChangeBaseAssets();

                    this._updateGatewayDetails();
                });
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

            onReadQrCode(result) {
                this.tx.recipient = result;
            }

            createTx() {
                const toGateway = this.outerSendMode && this.gatewayDetails;

                const tx = waves.node.transactions.createTransaction('transfer', {
                    ...this.tx,
                    sender: user.address,
                    recipient: toGateway ? this.gatewayDetails.address : this.tx.recipient,
                    attachment: toGateway ? this.gatewayDetails.attachment : this.tx.attachment
                });

                this.txInfo = tx;
                this.step++;
            }

            back() {
                this.step--;
            }

            onBlurMirror() {
                if (!this.mirror) {
                    this._fillMirror();
                }
                this.focus = '';
            }

            /**
             * @private
             */
            _onChangeMoneyHash() {
                const hash = this.moneyHash;
                const list = Object.values(hash).filter((money) => !money.getTokens().eq(0));
                if (list.length) {
                    this.choosableMoneyList = list;
                } else {
                    this.choosableMoneyList = [this.moneyHash[WavesApp.defaultAssets.WAVES]];
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
             * @return {Promise<Money[]>}
             * @private
             */
            _getBalanceList() {
                return waves.node.assets.userBalances()
                    .then((list) => list.map(({ available }) => available))
                    .then((list) => list.filter((money) => money.getTokens().gt(0)))
                    .then((list) => utils.toHash(list, 'asset.id'))
                    .then(AssetSendCtrl._getAddMoneyProcessor(this.assetId))
                    .then(AssetSendCtrl._getAddMoneyProcessor(this.mirrorId));
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

            _currentHasCommission() {
                const details = this.gatewayDetails;

                const check = (feeList) => {
                    const feeHash = utils.groupMoney(feeList);
                    const balanceHash = this.moneyHash;
                    this.hasComission = Object.keys(feeHash).every((feeAssetId) => {
                        const fee = feeHash[feeAssetId];
                        return balanceHash[fee.asset.id] && balanceHash[fee.asset.id].gt(fee);
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

            _fillMirror() {
                utils.when(waves.utils.getRate(this.assetId, this.mirrorId)).then((rate) => {
                    const mirror = this.tx.amount.convertTo(this.moneyHash[this.mirrorId].asset, rate);
                    this.mirror = mirror;
                });
            }

            _fillAmount() {
                utils.when(waves.utils.getRate(this.mirrorId, this.assetId)).then((rate) => {
                    const amount = this.mirror.convertTo(this.moneyHash[this.assetId].asset, rate);
                    this.tx.amount = amount;
                });
            }

            _updateGatewayDetails() {
                const outerChain = outerBlockchains[this.assetId];
                const isValidWavesAddress = waves.node.isValidAddress(this.tx.recipient);

                this.outerSendMode = !isValidWavesAddress && outerChain && outerChain.isValidAddress(this.tx.recipient);

                if (this.outerSendMode) {
                    gatewayService.getWithdrawDetails(this.balance.asset, this.tx.recipient).then((details) => {
                        this.assetKeyName = gatewayService.getAssetKeyName(this.tx.amount.asset, 'withdraw');
                        this.gatewayDetails = details;
                        this.gatewayError = false;
                        $scope.$apply();
                        // TODO : validate amount field for gateway minimumAmount and maximumAmount
                    }, () => {
                        this.gatewayError = true;
                        $scope.$apply();
                    });
                } else {
                    this.assetKeyName = '';
                    this.gatewayDetails = null;
                }
            }

            static _getAddMoneyProcessor(assetId) {
                return (hash) => {
                    if (!hash[assetId]) {
                        return Waves.Money.fromTokens('0', assetId).then((money) => {
                            hash[assetId] = money;
                            return hash;
                        });
                    } else {
                        return hash;
                    }
                };
            }

        }

        return new AssetSendCtrl(this.assetId, this.canChooseAsset);
    };

    controller.$inject = [
        '$scope',
        'waves',
        'Base',
        'utils',
        'user',
        'createPoll',
        'outerBlockchains',
        'gatewayService'
    ];

    angular.module('app.utils')
        .controller('AssetSendCtrl', controller);
})();

/**
 * @typedef {object} ISendTx
 * @property {Money} amount
 * @property {Money} fee
 * @property {string} recipient
 * @property {string} attachment
 */
