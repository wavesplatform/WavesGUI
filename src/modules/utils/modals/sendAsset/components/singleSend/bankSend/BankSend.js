(function () {
    'use strict';

    const { Money } = require('@waves/data-entities');
    const { SIGN_TYPE } = require('@waves/signature-adapter');
    const MIN_TOKEN_COUNT = 100;
    const MAX_TOKEN_COUNT = 50000;

    /**
     * @param {Base} Base
     * @param {$rootScope.Scope} $scope
     * @param {ConfigService} configService
     * @param {Waves} waves
     * @param {app.utils} utils
     */
    const controller = function (Base,
                                 $scope,
                                 configService,
                                 waves,
                                 utils) {

        class BankSend extends Base {

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
             * @return {Money}
             */
            get balance() {
                return this.moneyHash[this.assetId];
            }

            /**
             * @return {Object<string, Money>}
             */
            get moneyHash() {
                return this.state.moneyHash;
            }

            /**
             * @return {boolean}
             */
            get isBankAccepted() {
                return !configService
                    .get('PERMISSIONS.CANT_TRANSFER_GATEWAY').includes(this.balance.asset.id);
            }

            /**
             * @return {boolean}
             */
            get isBankPendingOrError() {
                return this.termsLoadError || this.termsIsPending;
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
             * @type {boolean}
             */
            termsIsPending = true;
            /**
             * @type {boolean}
             */
            termsLoadError = false;
            /**
             * @type {boolean}
             */
            termsAccepted = false;
            /**
             * @type {boolean}
             */
            noMirror = false;
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
             * @type {string}
             */
            focus = '';
            /**
             * @type {Money | null}
             */
            mirror = null;
            /**
             * @type {Money | null}
             */
            maxCoinomatAmount = null;
            /**
             * @type {boolean}
             */
            canShowAmount = false;
            /**
             * @type {ISingleSendTx}
             */
            wavesTx = {
                type: SIGN_TYPE.TRANSFER,
                amount: null,
                attachment: '',
                fee: null,
                recipient: WavesApp.bankRecipient,
                assetId: ''
            };
            /**
             * @type {Function}
             */
            onSign = null;
            /**
             * @type {Function}
             */
            onChangeMode = null;

            $postLink() {

                const onHasMoneyHash = () => {
                    this.receive(utils.observe(this.tx, 'fee'), this._onChangeFee, this);
                    this.receive(utils.observe(this.tx, 'amount'), this._onChangeAmount, this);

                    this.receive(utils.observe(this.state, 'assetId'), this._onChangeAssetId, this);
                    this.receive(utils.observe(this.state, 'mirrorId'), this._onChangeMirrorId, this);

                    this.observe('mirror', this._onChangeAmountMirror);

                    if (this.isBankAccepted) {
                        this.observe(['termsLoadError', 'termsIsPending'], () => {
                            this.canShowAmount = !this.termsLoadError && !this.termsIsPending;
                            if (this.canShowAmount) {
                                setTimeout(() => {
                                    this._validateForm();
                                    this._fillMirror();
                                }, 0);
                            }
                        });
                    }

                    this.receive(utils.observe(this.tx, 'amount'), this._updateWavesTxObject, this);
                    this.receive(utils.observe(this.tx, 'attachment'), this._updateWavesTxObject, this);

                    this._onChangeBaseAssets();
                    this._setMinAndMaxAmount();
                    this._onChangeFee();
                    this._updateWavesTxObject();
                };

                if (!this.state.moneyHash) {
                    this.receiveOnce(utils.observe(this.state, 'moneyHash'), onHasMoneyHash);
                } else {
                    onHasMoneyHash();
                }

                this.receive(utils.observe(this.state, 'moneyHash'), () => {
                    this._onChangeBaseAssets();
                    this._onChangeFee();
                });
            }

            // $doCheck() {
            //     if (this.bankSend && this.bankSend.amount && !this.bankSend.amount.$touched) {
            //         this._validateForm();
            //         this._fillMirror();
            //     }
            // }

            setSendMode(mode) {
                this.onChangeMode({ mode });
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
                const attachmentString = this.tx.attachment ? this.tx.attachment.toString() : '';
                const tx = waves.node.transactions.createTransaction({
                    ...this.tx,
                    recipient: WavesApp.bankRecipient,
                    attachment: utils.stringToBytes(attachmentString),
                    amount: this.tx.amount
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
                const maxCoinomatAmount = this.balance.cloneWithTokens(MAX_TOKEN_COUNT);
                const minCoinomatAmount = this.balance.cloneWithTokens(MIN_TOKEN_COUNT);

                this.maxAmount = Money.min(maxCoinomatAmount, this.balance);
                this.minAmount = minCoinomatAmount;
                this.maxCoinomatAmount = maxCoinomatAmount;

                this._validateForm();
            }

            /**
             * @private
             */
            _validateForm() {
                if (this.bankSend.amount && this.tx.amount.getTokens().gt(0)) {
                    this.bankSend.amount.$setTouched(true);
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
            _onChangeAmount() {
                if (!this.noMirror && this.focus === 'amount') {
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
                    this.tx.amount = this.mirror.convertTo(this.balance.asset, rate);
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
            _updateWavesTxObject() {
                const attachmentString = this.tx.attachment ? this.tx.attachment.toString() : '';
                this.wavesTx = {
                    ...this.wavesTx,
                    attachment: utils.stringToBytes(attachmentString),
                    amount: this.tx.amount,
                    assetId: this.assetId
                };
            }

        }

        return new BankSend();
    };

    controller.$inject = ['Base', '$scope', 'configService', 'waves', 'utils'];

    angular.module('app.ui').component('wBankSend', {
        bindings: {
            state: '<',
            onSign: '&',
            onChangeMode: '&'
        },
        templateUrl: 'modules/utils/modals/sendAsset/components/singleSend/bankSend/bank-send.html',
        transclude: true,
        controller
    });
})();
