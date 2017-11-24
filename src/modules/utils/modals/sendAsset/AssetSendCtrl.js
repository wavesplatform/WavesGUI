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

                this.observe('amount', this._onChangeAmount);
                this.observe('amountMirror', this._onChangeAmountMirror);
                this.observe('assetId', this._onChangeAssetId);

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
                 * @type {IAssetWithBalance}
                 */
                this.asset = null;
                /**
                 * @type {string}
                 */
                this.attachment = null;
                /**
                 * @type {IAssetWithBalance}
                 */
                this.mirror = null;
                /**
                 * @type {IAssetWithBalance[]}
                 */
                this.assetList = null;
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

                if (this.canChooseAsset) {
                    createPoll(this, this._getBalanceList, this._setAssets, 1000, { isBalance: true });
                } else {
                    createPoll(this, this._getAsset, this._setAssets, 1000, { isBalance: true });
                }
            }

            send() {
                return utils.whenAll([
                    user.getSeed(),
                    Waves.Money.fromTokens(this.amount, this.asset.id)
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
                    .then(([asset, mirror, [fee], api]) => {
                        this.noMirror = asset.id === mirror.id || api.rate.eq(0);
                        this.amount = new BigNumber(0);
                        this.amountMirror = new BigNumber(0);
                        this.mirror = mirror;
                        this._setAssets(asset);
                        this.asset = tsUtils.find(this.assetList, { id: this.assetId });
                        this.fee = fee;
                    });
            }

            /**
             * @return {Promise.<IAssetWithBalance>}
             * @private
             */
            _getAsset() {
                return waves.node.assets.balance(this.assetId);
            }

            /**
             * @param {IAssetWithBalance|IAssetWithBalance[]} assets
             * @private
             */
            _setAssets(assets) {
                this.assetList = utils.toArray(assets);
                if (!this.assetId && this.assetList.length) {
                    this.assetId = this.assetList[0].id;
                }
            }

            /**
             * @private
             */
            _onChangeAmount() {
                this.amount && this.asset && this._getRate()
                    .then((api) => {
                        if (api.exchangeReverse(this.amountMirror)
                                .toFixed(this.asset.precision) !== this.amount.toFixed(this.asset.precision)) {
                            this.amountMirror = api.exchange(this.amount).round(this.mirror.precision);
                        }
                    });
            }

            /**
             * @private
             */
            _onChangeAmountMirror() {
                this.amountMirror && this.mirror && this._getRate()
                    .then((api) => {
                        if (api.exchange(this.amount)
                                .toFixed(this.mirror.precision) !== this.amountMirror.toFixed(this.mirror.precision)) {
                            this.amount = api.exchangeReverse(this.amountMirror).round(this.asset.precision);
                        }
                    });
            }

            /**
             * @param {string} [fromRateId]
             * @return {Promise.<Waves.rateApi>}
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
