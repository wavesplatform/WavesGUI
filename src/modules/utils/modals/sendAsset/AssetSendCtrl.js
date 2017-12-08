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
     * @param {function} createPoll
     * @param {@constructor PollComponent} PollComponent
     * @param {ModalManager} modalManager
     * @return {AssetSendCtrl}
     */
    const controller = function ($scope, $mdDialog, waves, Base, utils, user, eventManager, createPoll, modalManager) {

        class AssetSendCtrl extends Base {

            /**
             * @param {string} assetId
             * @param {string} mirrorId
             * @param {boolean} canChooseAsset
             */
            constructor(assetId, mirrorId, canChooseAsset) {
                super($scope);

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
                 * Id from created transaction
                 * @type {string}
                 * @private
                 */
                this._transactionId = null;

                this.observe('amount', this._onChangeAmount);
                this.observe('amountMirror', this._onChangeAmountMirror);
                this.observe('assetId', this._onChangeAssetId);

                this._onChangeAssetId();

                if (this.canChooseAsset) {
                    createPoll(this, this._getBalanceList, this._setAssets, 1000, {isBalance: true});
                } else {
                    createPoll(this, this._getAsset, this._setAssets, 1000, {isBalance: true});
                }
            }

            send() {
                return utils.whenAll([
                    user.getSeed(),
                    Waves.Money.fromTokens(this.amount, this.balance.asset.id)
                ])
                    .then(([seed, amount]) => waves.node.assets.transfer({
                        fee: this.fee,
                        keyPair: seed.keyPair,
                        attachment: this.attachment,
                        recipient: this.recipient,
                        amount
                    }))
                    .then((transaction) => {
                        this._transactionId = transaction.id;
                        this.step++;
                    });
            }

            showTransaction() {
                $mdDialog.hide();
                setTimeout(() => { // Timeout for routing (if modal has route)
                    modalManager.showTransactionInfo(this._transactionId);
                }, 1000);
            }

            cancel() {
                $mdDialog.cancel();
            }

            onReadQrCode(result) {
                this.recipient = result;
            }

            _getBalanceList() {
                return waves.node.assets.userBalances().then((list) => {
                    return list && list.length ? list : waves.node.assets.balanceList([WavesApp.defaultAssets.WAVES]);
                });
            }

            _onChangeAssetId() {
                if (!this.assetId) {
                    return null;
                }
                this.ready = utils.whenAll([
                    this.canChooseAsset ? this._getBalanceList() : waves.node.assets.balance(this.assetId),
                    waves.node.assets.info(this.mirrorId),
                    waves.node.assets.fee('transfer'),
                    waves.utils.getRateApi(this.assetId, this.mirrorId)
                ])
                    .then(([balance, mirrorBalance, [fee], api]) => {
                        this.noMirror = balance.id === mirrorBalance.id || api.rate.eq(0);
                        this.amount = new BigNumber(0);
                        this.amountMirror = new BigNumber(0);
                        this.mirrorBalance = mirrorBalance;
                        this._setAssets(balance);
                        this.balance = tsUtils.find(this.moneyList, (item) => item.asset.id === this.assetId);
                        this.fee = fee;
                    });
            }

            /**
             * @return {Promise<Money>}
             * @private
             */
            _getAsset() {
                return waves.node.assets.balance(this.assetId);
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
                this.amount && this.balance && this._getRate()
                    .then((api) => {
                        if (api.exchangeReverse(this.amountMirror)
                                .toFixed(this.balance.asset.precision) !== this.amount.toFixed(this.balance.precision)) {
                            this.amountMirror = api.exchange(this.amount).round(this.mirrorBalance.precision);
                        }
                    });
            }

            /**
             * @private
             */
            _onChangeAmountMirror() {
                this.amountMirror && this.mirrorBalance && this._getRate()
                    .then((api) => {
                        if (api.exchange(this.amount)
                                .toFixed(this.mirrorBalance.precision) !== this.amountMirror.toFixed(this.mirrorBalance.precision)) {
                            this.amount = api.exchangeReverse(this.amountMirror).round(this.balance.precision);
                        }
                    });
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
        'createPoll',
        'modalManager'
    ];

    angular.module('app.utils')
        .controller('AssetSendCtrl', controller);
})();
