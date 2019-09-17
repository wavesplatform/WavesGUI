(function () {
    'use strict';

    const { SIGN_TYPE } = require('@waves/signature-adapter');
    const analytics = require('@waves/event-sender');

    /**
     * @param Base
     * @param {app.utils} utils
     * @param {Waves} waves
     * @return {SingleSend}
     */
    const factory = function (Base, utils, waves) {

        class SingleSend extends Base {

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
             * @return {string}
             */
            get mirrorId() {
                return this.state.mirrorId;
            }

            /**
             * @return {ISingleSendTx}
             */
            get tx() {
                return this.state.singleSend;
            }

            /**
             * @type {Function}
             */
            onSign = null;
            /**
             * @type {Money}
             */
            minAmount = null;
            /**
             * @type {Money}
             */
            maxAmount = null;
            /**
             * @type {Array}
             */
            feeList = [];
            /**
             * @type {boolean}
             */
            hasFee = true;
            /**
             * @type {Money}
             */
            mirror = null;
            /**
             * @type {boolean}
             */
            noMirror = false;
            /**
             * @type {string}
             */
            focus = '';
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
             * @type {args}
             */
            signPending = false;
            /**
             * @type {$rootScope.Scope}
             * @private
             */
            __$scope = null;
            /**
             * @type {boolean}
             * @private
             */
            _noCurrentRate = false;
            /**
             * @type {Array}
             * @private
             */
            _listeners = [];

            constructor($scope) {
                super($scope);
                this.__$scope = $scope;

                const signPendingListener = this.__$scope.$on('signPendingChange', (event, data) => {
                    this.signPending = data;
                });

                this._listeners.push(signPendingListener);
            }

            $onDestroy() {
                super.$onDestroy();
                this._listeners.forEach(listener => listener());
            }

            onSignTx(signable) {
                analytics.send({ name: 'Transfer Continue Click', target: 'ui' });
                this.onSign({ signable });
            }

            /**
             * @param {string} url
             * @return {null}
             */
            onReadQrCode(url) {
                if (!url.includes('https://')) {
                    this.tx.recipient = url;
                    this.__$scope.$apply();
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
                            this.tx.amount = this.balance.cloneWithTokens(result.amount);
                            this._fillMirror();
                        }
                        this.__$scope.$apply();
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
                    this._noCurrentRate = true;
                    this.mirror = amount.convertTo(this.moneyHash[this.mirrorId].asset, rate);
                    this.tx.amount = amount;
                    this._noCurrentRate = false;
                    this.__$scope.$apply();
                });
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
            _onChangeAssetId() {
                if (!this.assetId) {
                    throw new Error('Has no asset id!');
                }

                this._onChangeBaseAssets();

                if (!this.balance) {
                    return null;
                }

                this.tx.amount = this.balance.cloneWithTokens('0');
                this.mirror = this.moneyHash[this.mirrorId].cloneWithTokens('0');
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
            _onChangeAmountMirror() {
                if (!this._noCurrentRate && this.focus === 'mirror') {
                    this._fillAmount();
                }
            }

            /**
             * @private
             */
            _onChangeAmount() {
                if (!this._noCurrentRate && !this.noMirror && this.focus === 'amount') {
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
                    this.__$scope.$digest();
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
                    this.tx.amount = this.mirror.convertTo(this.balance.asset, rate);
                    this.__$scope.$digest();
                });
            }

        }

        return SingleSend;
    };

    factory.$inject = ['Base', 'utils', 'waves'];

    angular.module('app.utils').factory('SingleSend', factory);
})();
