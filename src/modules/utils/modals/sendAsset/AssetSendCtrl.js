(function () {
    'use strict';

    /**
     * @param $scope
     * @param {Waves} waves
     * @param {Base} Base
     * @param {app.utils} utils
     * @param {IPollCreate} createPoll
     * @param {User} user
     * @return {AssetSendCtrl}
     */
    const controller = function ($scope, waves, Base, utils, createPoll, user) {

        class AssetSendCtrl extends Base {

            /**
             * @return {Money}
             */
            get balance() {
                return this.state.moneyHash && this.state.moneyHash[this.state.assetId];
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
                this.headerPath = 'modules/utils/modals/sendAsset/send-header.html';
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
                 * @type {Object.<string, Money>}
                 */
                this.moneyHash = null;
                /**
                 * @type {ISendState}
                 */
                this.state = {
                    assetId: assetId || WavesApp.defaultAssets.WAVES,
                    mirrorId: user.getSetting('baseAssetId'),
                    moneyHash: null,
                    singleSend: Object.create(null),
                    massSend: Object.create(null)
                };
                /**
                 * @type {Poll}
                 */
                this.poll = createPoll(this, this._getBalanceList, 'state.moneyHash', 1000, { isBalance: true });
                /**
                 * @type {*}
                 */
                this.txInfo = Object.create(null);

                this.receive(utils.observe(this.state, 'moneyHash'), this._onChangeMoneyHash, this);
                this.receive(utils.observe(this.state, 'assetId'), () => this.poll.restart());
            }

            back() {
                this.step--;
            }

            nextStep(tx) {
                this.txInfo = tx;
                this.step++;
            }

            /**
             * @private
             */
            _onChangeMoneyHash() {
                const hash = this.state.moneyHash;
                const list = Object.values(hash).filter((money) => !money.getTokens().eq(0));
                if (list.length) {
                    this.choosableMoneyList = list;
                } else {
                    this.choosableMoneyList = [this.state.moneyHash[this.state.assetId]];
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
                    .then(AssetSendCtrl._getAddMoneyProcessor(this.state.assetId))
                    .then(AssetSendCtrl._getAddMoneyProcessor(this.state.mirrorId));
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
        'createPoll',
        'user'
    ];

    angular.module('app.utils')
        .controller('AssetSendCtrl', controller);
})();

/**
 * @typedef {function} AssetSendCtrl.IMoneyProcessor
 * @param {Object.<IMoney>} hash
 * @return {Object.<Money>}
 */

/**
 * @typedef {object} ISingleSendTx
 * @property {string} recipient
 * @property {Money} amount
 * @property {Money} fee
 * @property {string} attachment
 */

/**
 * @typedef {object} IMassSendTx
 * @property {string} attachment
 * @property {Array<ITransferItem>} transfers
 */

/**
 * @typedef {object} ITransferItem
 * @property {string} recipient
 * @property {Money} amount
 */

/**
 * @typedef {object} ISendState
 * @property {string} assetId
 * @property {string} mirrorId
 * @property {Object.<string, Money>} moneyHash
 * @property {ISingleSendTx} singleSend
 * @property {IMassSendTx} massSend
 */
