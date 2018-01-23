(function () {
    'use strict';

    /**
     * @param $scope
     * @param $mdDialog
     * @param {Waves} waves
     * @param {Base} Base
     * @param {app.utils} utils
     * @param {User} user
     * @param {EventManager} eventManager
     * @param {NotificationManager} notificationManager
     * @param {function} createPoll
     * @param {@constructor PollComponent} PollComponent
     * @param {ModalManager} modalManager
     * @param outerBlockchains
     * @param {GatewayService} gatewayService
     * @return {AssetSendCtrl}
     */
    const controller = function ($scope, $mdDialog, waves, Base, utils, user, eventManager, notificationManager,
                                 createPoll, modalManager, outerBlockchains, gatewayService) {

        class AssetSendCtrl extends Base {

            /**
             * @param {string} assetId
             * @param {string} mirrorId
             * @param {boolean} canChooseAsset
             */
            constructor(assetId, mirrorId, canChooseAsset) {
                super($scope);

                this.tx = Object.create(null);
                /**
                 * @type {Money}
                 */
                this.fee = null;
                /**
                 * @type {BigNumber}
                 */
                this.amount = null;
                /**
                 * @type {BigNumber}
                 */
                this.amountMirror = null;
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
                this.mirrorId = mirrorId;
                /**
                 * @type {string}
                 */
                this.assetId = assetId || WavesApp.defaultAssets.WAVES;
                /**
                 * @type {string}
                 */
                this.recipient = '';
                /**
                 * @type {Money}
                 */
                this.balance = null;
                /**
                 * @type {string}
                 */
                this.attachment = null;
                /**
                 * @type {Money}
                 */
                this.mirrorBalance = null;
                /**
                 * @type {Money[]}
                 */
                this.moneyList = null;
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
                 * Id from created transaction
                 * @type {string}
                 * @private
                 */
                this._transactionId = null;

                this.observe('amount', this._onChangeAmount);
                this.observe('amountMirror', this._onChangeAmountMirror);
                this.observe('assetId', this._onChangeAssetId);
                this.observe('recipient', this._updateGatewayDetails);

                this._onChangeAssetId({});

                if (this.canChooseAsset) {
                    createPoll(this, this._getBalanceList, this._setAssets, 1000, { isBalance: true });
                } else {
                    createPoll(this, this._getAsset, this._setAssets, 1000, { isBalance: true });
                }
            }

            fillMax() {
                // TODO : consider gateway fee
                if (this.assetId === this.fee.asset.id) {
                    if (this.balance.getTokens().gt(this.fee.getTokens())) {
                        this.amount = this.balance.getTokens()
                            .sub(this.fee.getTokens());
                    }
                } else {
                    this.amount = this.balance.getTokens();
                }
            }

            onReadQrCode(result) {
                this.recipient = result;
            }

            createTx() {
                return Waves.Money.fromTokens(this.amount, this.assetId)
                    .then((amount) => waves.node.transactions.createTransaction('transfer', {
                        amount,
                        sender: user.address,
                        fee: this.fee,
                        recipient: this.recipient,
                        attachment: this.attachment
                    })).then((tx) => {
                        this.tx = tx;
                        this.step++;
                    });
            }

            back() {
                this.step--;
            }

            _getBalanceList() {
                return waves.node.assets.userBalances().then((list) => {
                    return list && list.length ? list : waves.node.assets.balanceList([WavesApp.defaultAssets.WAVES]);
                }).then((list) => list.map(({ available }) => available));
            }

            _onChangeAssetId({ prev }) {
                if (!this.assetId) {
                    return null;
                }

                if (prev) {
                    analytics.push('Send', 'Send.ChangeCurrency', this.assetId);
                }

                this.ready = utils.whenAll([
                    this.canChooseAsset ? this._getBalanceList() : waves.node.assets.balance(this.assetId).then(({ available }) => available),
                    waves.node.assets.info(this.mirrorId),
                    waves.node.assets.fee('transfer'),
                    waves.utils.getRateApi(this.assetId, this.mirrorId)
                ]).then(([balance, mirrorBalance, [fee], api]) => {
                    this.noMirror = balance.id === mirrorBalance.id || api.rate.eq(0);
                    this.amount = new BigNumber(0);
                    this.amountMirror = new BigNumber(0);
                    this.mirrorBalance = mirrorBalance;
                    this._setAssets(balance);
                    this.balance = tsUtils.find(this.moneyList, (item) => item.asset.id === this.assetId);
                    this.fee = fee;
                }).then(() => this._updateGatewayDetails());
            }

            /**
             * @return {Promise<Money>}
             * @private
             */
            _getAsset() {
                return waves.node.assets.balance(this.assetId).then(({ available }) => available);
            }

            /**
             * @param {Money|Money[]} money
             * @private
             */
            _setAssets(money) {
                this.moneyList = utils.toArray(money);
                if (!this.assetId && this.moneyList.length) {
                    this.assetId = this.moneyList[0].asset.id;
                }
            }

            /**
             * @private
             */
            _onChangeAmount() {
                if (this.amount && this.balance) {
                    this._getRate().then((api) => {
                        const mirrorVal = api.exchangeReverse(this.amountMirror).toFixed(this.balance.asset.precision);
                        if (mirrorVal !== this.amount.toFixed(this.balance.precision)) {
                            this.amountMirror = api.exchange(this.amount).round(this.mirrorBalance.precision);
                        }
                    });
                }
            }

            /**
             * @private
             */
            _onChangeAmountMirror() {
                if (this.amountMirror && this.mirrorBalance) {
                    this._getRate().then((api) => {
                        const amountVal = api.exchange(this.amount).toFixed(this.mirrorBalance.precision);
                        if (amountVal !== this.amountMirror.toFixed(this.mirrorBalance.precision)) {
                            this.amount = api.exchangeReverse(this.amountMirror).round(this.balance.precision);
                        }
                    });
                }
            }

            _updateGatewayDetails() {
                const outerChain = outerBlockchains[this.assetId];
                this.outerSendMode = outerChain && outerChain.isValidAddress(this.recipient);

                if (this.outerSendMode) {
                    gatewayService.getWithdrawDetails(this.balance.asset, user.address).then((details) => {
                        this.assetKeyName = gatewayService.getAssetKeyName(this.balance.asset, 'withdraw');
                        this.gatewayDetails = details;
                        // TODO : validate amount field for gateway minimumAmount and maximumAmount
                    });
                } else {
                    this.assetKeyName = '';
                    this.gatewayDetails = null;
                }
            }

            /**
             * @param {string} [fromRateId]
             * @return {Promise<WavesUtils.rateApi>}
             * @private
             */
            _getRate(fromRateId) {
                return waves.utils.getRateApi(fromRateId || this.assetId, this.mirrorId);
            }

        }

        return new AssetSendCtrl(this.assetId, this.baseAssetId, this.canChooseAsset);
    };

    controller.$inject = [
        '$scope',
        '$mdDialog',
        'waves',
        'Base',
        'utils',
        'user',
        'eventManager',
        'notificationManager',
        'createPoll',
        'modalManager',
        'outerBlockchains',
        'gatewayService'
    ];

    angular.module('app.utils')
        .controller('AssetSendCtrl', controller);
})();
