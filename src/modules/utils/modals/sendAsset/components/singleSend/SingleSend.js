(function () {
    'use strict';

    const FIAT_ASSETS = {
        [WavesApp.defaultAssets.USD]: true,
        [WavesApp.defaultAssets.EUR]: true,
        [WavesApp.defaultAssets.TRY]: true
    };

    const { Money } = require('@waves/data-entities');
    const ds = require('data-service');

    const BANK_RECIPIENT = WavesApp.bankRecipient;
    const MIN_TOKEN_COUNT = 100;
    const MAX_TOKEN_COUNT = 50000;

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
    const controller = function (Base,
                                 $scope,
                                 utils,
                                 createPoll,
                                 waves,
                                 outerBlockchains,
                                 user,
                                 gatewayService) {

        class SingleSend extends Base {

            /**
             * @return {boolean}
             */
            get hasSendToBank() {
                return FIAT_ASSETS[this.assetId] || false;
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
             * @return {Object.<string, Money>}
             */
            get feeHash() {
                return utils.groupMoney(this.feeList || []);
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

            get isBankPendingOrError() {
                return this.isBankError || this.isBankPending;
            }

            get hasOuterError() {
                return this.outerSendMode && this.gatewayDetailsError || this.isBankError;
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
            hasComission = true;
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
             * @type {boolean}
             * @private
             */
            _noCurrentRate = false;

            constructor() {
                super();

                $scope.WavesApp = WavesApp;
            }

            $postLink() {

                this.receive(utils.observe(this.tx, 'fee'), this._currentHasCommission, this);

                this.receiveOnce(utils.observe(this.state, 'moneyHash'), () => {

                    this.receive(utils.observe(this.state, 'toBankMode'), this._onChangeBankMode, this);
                    this.observe('gatewayDetails', this._currentHasCommission);

                    this.minAmount = this.state.moneyHash[this.state.assetId].cloneWithTokens('0');
                    this.tx.amount = this.tx.amount || this.moneyHash[this.assetId].cloneWithTokens('0');
                    this._fillMirror();

                    this.receive(utils.observe(this.state, 'assetId'), this._onChangeAssetId, this);
                    this.receive(utils.observe(this.state, 'mirrorId'), this._onChangeMirrorId, this);

                    this.receive(utils.observe(this.state, 'paymentId'), this._updateGatewayDetails, this);
                    this.receive(utils.observe(this.tx, 'recipient'), this._updateGatewayDetails, this);

                    this.receive(utils.observe(this.tx, 'amount'), this._onChangeAmount, this);
                    this.observe('mirror', this._onChangeAmountMirror);

                    this._currentHasCommission();
                    this._onChangeBaseAssets();
                    this._updateGatewayDetails();
                });
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

                const tx = waves.node.transactions.createTransaction({
                    ...this.tx,
                    recipient: toGateway ? this.gatewayDetails.address : this.tx.recipient,
                    attachment: toGateway ? this.gatewayDetails.attachment : this.tx.attachment,
                    amount: toGateway ? this.tx.amount.add(fee) : this.tx.amount
                });

                const signable = ds.signature.getSignatureApi().makeSignable({
                    type: tx.type,
                    data: tx
                });

                return signable;
            }

            onSignTx(signable) {
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

                const routeData = utils.getRouterParams(utils.getUrlForRoute(url));

                if (!routeData || routeData.name !== 'SEND_ASSET') {
                    return null;
                }

                const result = routeData.data;

                this.tx.recipient = result.recipient;

                analytics.push('Send', `Send.QrCodeRead.${WavesApp.type}`, `Send.QrCodeRead.${WavesApp.type}.Success`);

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
            isMoneroAddress() {
                return this.state.assetId === WavesApp.defaultAssets.XMR;
            }

            getGatewayDetails() {
                this._onChangeAssetId();
            }

            _validateForm() {
                if (this.tx.amount.getTokens().gt(0) || this.tx.recipient) {
                    this.send.$setDirty(true);
                    this.send.$setSubmitted(true);
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

                this._setMinAmount();
            }

            /**
             * @private
             */
            _setMinAmount() {
                if (this.toBankMode && !this.isLira) {
                    const maxCoinomatAmount = this.balance.cloneWithTokens(50000);
                    const minCoinomatAmount = this.balance.cloneWithTokens(100);

                    this.maxAmount = Money.min(maxCoinomatAmount, this.balance);
                    this.minAmount = minCoinomatAmount;
                } else {
                    this.minAmount = this.state.moneyHash[this.assetId].cloneWithTokens('0');
                    this.maxAmount = this.moneyHash[this.assetId];
                }

                this._validateForm();
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

                analytics.push('Send', `Send.ChangeCurrency.${WavesApp.type}`, this.assetId);
            }

            /**
             * @private
             */
            _currentHasCommission() {
                if (!this.moneyHash) {
                    return null;
                }

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
                    check(this.feeList.concat(this.balance.cloneWithTokens(details.minimumAmount)));
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
                if (!this._noCurrentRate && !this.noMirror && this.focus === 'amount') {
                    this._fillMirror();
                }
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
            _fillMirror() {

                if (!this.tx.amount) {
                    this.mirror = null;
                    setTimeout(() => $scope.$digest(), 0);
                    return null;
                }

                waves.utils.getRate(this.assetId, this.mirrorId).then((rate) => {
                    this.mirror = this.tx.amount.convertTo(this.moneyHash[this.mirrorId].asset, rate);
                    $scope.$digest();
                });
            }

            /**
             * @private
             */
            _fillAmount() {

                if (!this.mirror) {
                    this.tx.amount = null;
                    setTimeout(() => $scope.$digest(), 0);
                    return null;
                }

                waves.utils.getRate(this.mirrorId, this.assetId).then((rate) => {
                    this.tx.amount = this.mirror.convertTo(this.moneyHash[this.assetId].asset, rate);
                    $scope.$digest();
                });
            }

            /**
             * @private
             */
            _updateGatewayDetails() {
                if (this.toBankMode && !this.isLira) {
                    this._setMinAmount();
                    return;
                }

                const outerChain = outerBlockchains[this.assetId];
                const isValidWavesAddress = waves.node.isValidAddress(this.tx.recipient);

                if (this.gatewayDetailsError) {
                    this.outerSendMode = false;
                    this.gatewayDetailsError = false;
                }

                this.outerSendMode = !isValidWavesAddress && outerChain && outerChain.isValidAddress(this.tx.recipient);

                if (this.outerSendMode) {
                    return gatewayService.getWithdrawDetails(this.balance.asset, this.tx.recipient, this.paymentId)
                        .then((details) => {
                            const max = BigNumber.min(
                                details.maximumAmount.plus(details.gatewayFee),
                                this.moneyHash[this.assetId].getTokens()
                            );

                            this.gatewayDetails = details;
                            this.minAmount = this.moneyHash[this.assetId]
                                .cloneWithTokens(details.minimumAmount.minus('0.00000001'));
                            this.maxAmount = this.moneyHash[this.assetId].cloneWithTokens(max);
                            this.maxGatewayAmount = Money.fromTokens(details.maximumAmount, this.balance.asset);
                        }, () => {
                            this.gatewayDetails = null;
                            this.gatewayDetailsError = true;
                        });
                } else {
                    this.minAmount = this.state.moneyHash[this.assetId].cloneWithTokens('0');
                    this.maxAmount = this.moneyHash[this.assetId];
                    this.gatewayDetails = null;
                    this._validateForm();
                }
                return Promise.resolve();
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
