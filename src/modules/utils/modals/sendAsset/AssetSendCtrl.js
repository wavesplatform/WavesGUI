(function () {
    'use strict';

    /**
     * @param $scope
     * @param $mdDialog
     * @param {AssetsService} assetsService
     * @param {Base} Base
     * @param {app.utils} utils
     * @param {app.utils.apiWorker} apiWorker
     * @param {User} user
     * @param {EventManager} eventManager
     * @return {AssetSendCtrl}
     */
    const controller = function ($scope, $mdDialog, assetsService, Base, utils, apiWorker, user, eventManager) {

        class AssetSendCtrl extends Base {

            /**
             * @param {string} assetId
             * @param {string} mirrorId
             * @param {boolean} canChooseAsset
             */
            constructor(assetId, mirrorId, canChooseAsset) {
                super($scope);
                this.step = 'send';
                /**
                 * @type {string}
                 */
                this.assetId = assetId || WavesApp.defaultAssets.WAVES;
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
                this.recipient = '';
                /**
                 * @type {Poll}
                 */
                this.updateBalance = this.createPoll(this._getAsset, 'asset', 1000);
                /**
                 * @type {IFeeData}
                 */
                this.feeData = null;

                if (this.canChooseAsset) {
                    assetsService.getBalanceList().then((list) => {
                        this.assetList = list;
                    });
                }

                this.observe('amount', this._onChangeAmount);
                this.observe('amountMirror', this._onChangeAlias);

                this.ready = utils.when(Promise.all([
                    assetsService.getAssetInfo(assetId),
                    assetsService.getAssetInfo(mirrorId),
                    assetsService.getFeeSend()
                ]))
                    .then((data) => {
                        const [asset, alias, feeData] = data;
                        this.amount = 0;
                        this.amountMirror = 0;
                        this.feeAlias = 0;
                        this.asset = asset;
                        this.alias = alias;
                        this.feeData = feeData;

                        this.fee = feeData.fee;
                        this._getRate()
                            .then((api) => {
                                this.feeAlias = api.exchange(this.fee);
                            });
                    });
            }

            send() {
                if (this.step === 'send') {
                    this.step = 'confirm';
                } else {
                    user.getSeed()
                        .then((data) => {
                            return apiWorker.process((WavesApi, data) => {
                                return WavesApi.API.Node.v1.assets.transfer({
                                    assetId: data.assetId,
                                    recipient: data.recipient,
                                    amount: data.amount
                                }, data.keyPair);
                            }, {
                                assetId: this.assetId,
                                recipient: this.recipient,
                                keyPair: data.keyPair,
                                amount: this.amount * Math.pow(10, this.asset.precision)
                                    .toFixed(this.asset.precision)
                            });
                        })
                        .then((data) => {
                            eventManager.addEvent({
                                type: eventManager.getAvailableEvents().transfer,
                                data: {
                                    id: data.id,
                                    amount: { ...this.asset, balance: this.amount }
                                }
                            });
                            $mdDialog.hide();
                        });
                }
            }

            fillMax() {
                if (this.asset.id === this.feeData.id) {
                    if (this.asset.balance >= this.fee) {
                        this.amount = this.asset.balance - this.feeData.fee;
                    }
                } else {
                    this.amount = this.asset.balance;
                }
            }

            cancel() {
                $mdDialog.cancel();
            }

            onReadQrCode(result) {
                this.recipient = result;
            }

            /**
             * @returns {Promise.<IAssetWithBalance>}
             * @private
             */
            _getAsset() {
                return assetsService.getBalance(this.assetId);
            }

            /**
             * @private
             */
            _onChangeAmount() {
                this._getRate()
                    .then((api) => {
                        if (api.exchangeReverse(this.amountMirror) !== this.amount) {
                            this.amountMirror = api.exchange(this.amount);
                        }
                    });
            }

            /**
             * @private
             */
            _onChangeAlias() {
                this._getRate()
                    .then((api) => {
                        if (api.exchange(this.amount) !== this.amountMirror) {
                            this.amount = this.exchangeReverse(this.amountMirror);
                        }
                    });
            }

            /**
             * @returns {Promise.<AssetsService.rateApi>}
             * @private
             */
            _getRate() {
                return assetsService.getRate(this.asset.id, this.alias.id);
            }

        }

        return new AssetSendCtrl(this.assetId, this.baseAssetId, this.canChooseAsset);
    };

    controller.$inject = [
        '$scope',
        '$mdDialog',
        'assetsService',
        'Base',
        'utils',
        'apiWorker',
        'user',
        'eventManager'
    ];

    angular.module('app.utils')
        .controller('AssetSendCtrl', controller);
})();
