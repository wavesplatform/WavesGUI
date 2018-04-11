(function () {
    'use strict';

    /**
     * @param $scope
     * @param {Waves} waves
     * @param {Base} Base
     * @param {app.utils} utils
     * @param {User} user
     * @param {IPollCreate} createPoll
     * @param outerBlockchains
     * @param {GatewayService} gatewayService
     * @return {AssetSendCtrl}
     */
    const controller = function ($scope, waves, Base, utils, createPoll) {

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
                 * @type {string}
                 */
                this.recipient = '';
                /**
                 * @type {typeof WavesApp.defaultAssets}
                 */
                this.defaultAssets = WavesApp.defaultAssets;
                /**
                 * @type {Array<Money>}
                 */
                this.choosableMoneyList = [];
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
                 * @type {Object.<string, Money>}
                 */
                this.moneyHash = null;
                /**
                 * @type {Poll}
                 */
                this.poll = createPoll(this, this._getBalanceList, 'moneyHash', 1000, { isBalance: true });

                this.observe('moneyHash', this._onChangeMoneyHash);
            }

            back() {
                this.step--;
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
                    this.choosableMoneyList = [this.moneyHash[this.assetId]];
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
             * @param {string} assetId
             * @return {AssetSendCtrl.IMoneyProcessor}
             * @private
             */
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
        'createPoll'
    ];

    angular.module('app.utils')
        .controller('AssetSendCtrl', controller);
})();

/**
 * @typedef {function} AssetSendCtrl.IMoneyProcessor
 * @param {Object.<IMoney>} hash
 * @return {Object.<Money>}
 */
