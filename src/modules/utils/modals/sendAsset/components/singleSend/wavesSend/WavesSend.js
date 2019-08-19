(function () {
    'use strict';

    const FIAT_ASSETS = {
        [WavesApp.defaultAssets.USD]: true,
        [WavesApp.defaultAssets.EUR]: true,
        [WavesApp.defaultAssets.TRY]: true
    };

    const { BigNumber } = require('@waves/bignumber');
    const ds = require('data-service');
    const { SIGN_TYPE } = require('@waves/signature-adapter');
    const analytics = require('@waves/event-sender');

    const BANK_RECIPIENT = WavesApp.bankRecipient;
    const MIN_TOKEN_COUNT = 100;
    const MAX_TOKEN_COUNT = 50000;

    /**
     * @param {Base} Base
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @param {IPollCreate} createPoll
     * @param {ConfigService} configService
     * @param {IOuterBlockchains} outerBlockchains
     * @param {User} user
     * @param {GatewayService} gatewayService
     * @param {Waves} waves
     */
    const controller = function (Base,
                                 $scope,
                                 utils,
                                 createPoll,
                                 waves,
                                 configService,
                                 outerBlockchains,
                                 user,
                                 gatewayService) {

        class WavesSend extends Base {

            /**
             * @return {boolean}
             */
            get canSendToBank() {
                return (FIAT_ASSETS[this.assetId] && !this.isLira) || false;
            }

            /**
             * @return {boolean}
             */
            get isLira() {
                return this.assetId === WavesApp.defaultAssets.TRY;
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
             * @return {string}
             */
            get paymentId() {
                return this.state.paymentId;
            }

            set paymentId(value) {
                this.state.paymentId = value;
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

            get isBankPending() {
                return this.toBankMode && this.termsIsPending;
            }

            get isBankError() {
                return this.toBankMode && this.termsLoadError;
            }

            get isGatewayAccepted() {
                return !configService
                    .get('PERMISSIONS.CANT_TRANSFER_GATEWAY').includes(this.balance.asset.id);
            }

            get isBankAccepted() {
                return this.toBankMode ? this.isGatewayAccepted : true;
            }

            get isBankPendingOrError() {
                return this.isBankError || this.isBankPending;
            }

            get minimumAmount() {
                return this.gatewayDetails &&
                    this.gatewayDetails.minimumAmount ||
                    this.toBankMode &&
                    new BigNumber(MIN_TOKEN_COUNT);
            }

            get maximumAmount() {
                return this.maxGatewayAmount || this.toBankMode && this.balance.cloneWithTokens(MAX_TOKEN_COUNT);
            }

            /**
             * @type {string}
             */
            txType = WavesApp.TRANSACTION_TYPES.NODE.TRANSFER;

            /**
             * @type {boolean}
             */
            get toBankMode() {
                return this.state.toBankMode;
            }

            set toBankMode(value) {
                this.state.toBankMode = value;
            }

            /**
             * @type {string}
             */
            digiLiraUserLink = 'https://www.digilira.com/';
            /**
             * @type {Function}
             */
            onContinue = null;
            /**
             * @type {Function}
             */
            onChangeMode = null;
            /**
             * @type {string}
             */
            focus = null;
            /**
             * @type {Money}
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
            feeList = null;
            /**
             * @type {Money}
             */
            minAmount = null;
            /**
             * @type {Money}
             */
            maxAmount = null;
            /**
             * @type {ISendState}
             */
            state = Object.create(null);
            /**
             * @type {Money}
             */
            maxGatewayAmount = null;
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
             * @type {boolean}
             */
            gatewayError = false;
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
            signInProgress = false;
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

            constructor() {
                gatewayService.getFiats();
                super();
            }

            $postLink() {
                this.receive(utils.observe(this.tx, 'recipient'), this._onUpdateRecipient, this);
                const onHasMoneyHash = () => {
                    // this.receive(utils.observe(this.state, 'toBankMode'), this._onChangeBankMode, this);
                    // this.observe('gatewayDetails', this._checkFee);
                    this.receive(utils.observe(this.tx, 'fee'), this._onUpdateFee, this);
                    this.tx.amount = this.tx.amount || this.moneyHash[this.assetId].cloneWithTokens('0');
                    // this._fillMirror();

                    // this.receive(utils.observe(this.state, 'assetId'), this._onChangeAssetId, this);
                    // this.receive(utils.observe(this.state, 'mirrorId'), this._onChangeMirrorId, this);

                    // this.receive(utils.observe(this.state, 'paymentId'), this._updateGatewayDetails, this);
                    // this.receive(utils.observe(this.tx, 'recipient'), this._updateGatewayDetails, this);

                    // this.receive(utils.observe(this.state, 'paymentId'), this._updateGatewayPermisson, this);
                    // this.receive(utils.observe(this.tx, 'recipient'), this._updateGatewayPermisson, this);

                    this.receive(utils.observe(this.tx, 'amount'), this._onChangeAmount, this);
                    this.observe('mirror', this._onChangeAmountMirror);

                    // this.observe('gatewayDetails', this._updateWavesTxObject);
                    // this.receive(utils.observe(this.tx, 'amount'), this._updateWavesTxObject, this);
                    // this.receive(utils.observe(this.tx, 'recipient'), this._updateWavesTxObject, this);
                    // this.receive(utils.observe(this.tx, 'attachment'), this._updateWavesTxObject, this);
                    //
                    // this.observe('mirror', this._onChangeAmountMirror);
                    // this.observe(['gatewayAddressError', 'gatewayDetailsError', 'gatewayWrongAddress'],
                    //     this._updateGatewayError);

                    this._onUpdateFee();
                    this._setMinAndMaxAmount();
                    this._onChangeBaseAssets();
                    // this._updateGatewayDetails();
                    // this._updateGatewayPermisson();
                };

                if (!this.state.moneyHash) {
                    this.receiveOnce(utils.observe(this.state, 'moneyHash'), onHasMoneyHash);
                } else {
                    onHasMoneyHash();
                }

                this.receive(utils.observe(this.state, 'moneyHash'), () => {
                    this._onUpdateFee();
                    this._setMinAndMaxAmount();
                    this._onChangeBaseAssets();
                    // this._updateGatewayDetails();
                });

                this._onChangeBaseAssets();
                this._updateWavesTxObject();
            }

            setSendMode(mode) {
                this.onChangeMode({ mode });
            }

            onSignCoinomatStart() {
                this.signInProgress = true;
            }

            onSignCoinomatEnd() {
                this.signInProgress = false;
            }

            createTx() {
                const toGateway = this.outerSendMode && this.gatewayDetails;
                const fee = toGateway ? this.tx.amount.cloneWithTokens(toGateway.gatewayFee) : null;
                const attachmentString = this.tx.attachment ? this.tx.attachment.toString() : '';
                const tx = waves.node.transactions.createTransaction({
                    ...this.tx,
                    recipient: toGateway ? this.gatewayDetails.address : this.tx.recipient,
                    attachment: utils.stringToBytes(toGateway ? this.gatewayDetails.attachment : attachmentString),
                    amount: toGateway ? this.tx.amount.add(fee) : this.tx.amount
                });

                const signable = ds.signature.getSignatureApi().makeSignable({
                    type: tx.type,
                    data: tx
                });

                return signable;
            }

            onSignTx(signable) {
                analytics.send({ name: 'Transfer Continue Click', target: 'ui' });
                this.onContinue({ signable });
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
             * @return {boolean}
             */
            isMoneroNotIntegratedAddress() {
                const moneroAddressLength = 95;
                const assetIsMonero = this.state.assetId === WavesApp.defaultAssets.XMR;
                return assetIsMonero && this.tx.recipient.length === moneroAddressLength;
            }

            getGatewayDetails() {
                this._onChangeAssetId();
            }

            /**
             * @private
             */
            _updateWavesTxObject() {
                const toGateway = this.outerSendMode && this.gatewayDetails;
                const fee = toGateway ? this.tx.amount.cloneWithTokens(toGateway.gatewayFee) : null;
                const attachmentString = this.tx.attachment ? this.tx.attachment.toString() : '';
                const isWavesAddress = user.isValidAddress(this.tx.recipient);
                this.wavesTx = {
                    ...this.wavesTx,
                    recipient: toGateway ? this.gatewayDetails.address : isWavesAddress && this.tx.recipient || '',
                    attachment: utils.stringToBytes(toGateway ? this.gatewayDetails.attachment : attachmentString),
                    amount: toGateway ? this.tx.amount.add(fee) : this.tx.amount,
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
                }
            }

            /**
             * @private
             */
            _onChangeBankMode() {
                if (this.toBankMode && !this.isLira) {
                    this.tx.recipient = BANK_RECIPIENT;
                    this.termsIsPending = true;
                } else {
                    this.tx.recipient = '';
                    this.termsIsPending = false;
                }

                this._updateGatewayPermisson();
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
                this._updateGatewayPermisson();
            }

            /**
             * @private
             */
            _onUpdateFee() {
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
                    waves.utils.getRate(this.assetId, this.mirrorId).then((rate) => {
                        this.noMirror = rate.eq(0);
                    });
                }
            }

            _setMinAndMaxAmount() {
                this.minAmount = this.state.moneyHash[this.state.assetId].cloneWithTokens('0');
                this.maxAmount = this.moneyHash[this.assetId];
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

                waves.utils.getRate(this.assetId, this.mirrorId).then((rate) => {
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

                waves.utils.getRate(this.mirrorId, this.assetId).then((rate) => {
                    this.tx.amount = this.mirror.convertTo(this.moneyHash[this.assetId].asset, rate);
                });
            }

            /**
             * @private
             */
            _onUpdateRecipient() {
                this._validateForm();
            }

            /**
             * @private
             */
            _updateGatewayPermisson() {
                this.gatewayDetailsError = this.outerSendMode ? !this.isGatewayAccepted : this.gatewayDetailsError;
            }

            /**
             * @private
             */
            _updateGatewayError() {
                this.gatewayError = this.gatewayAddressError || this.gatewayDetailsError || this.gatewayWrongAddress;
            }

        }

        return new WavesSend();
    };

    controller.$inject = [
        'Base',
        '$scope',
        'utils',
        'createPoll',
        'waves',
        'configService',
        'outerBlockchains',
        'user',
        'gatewayService'
    ];

    angular.module('app.ui').component('wWavesSend', {
        bindings: {
            state: '<',
            onContinue: '&',
            onChangeMode: '&'
        },
        templateUrl: 'modules/utils/modals/sendAsset/components/singleSend/wavesSend/waves-send.html',
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
