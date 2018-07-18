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
             * @return {boolean}
             */
            get outerSendMode() {
                return this.state.outerSendMode;
            }

            /**
             * @return {IGatewayDetails}
             */
            get gatewayDetails() {
                return this.state.gatewayDetails;
            }

            /**
             * @param {IAssetSendCtrl.IOptions} options
             */
            constructor(options) {
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
                this.canChooseAsset = !options.assetId || options.canChooseAsset;
                /**
                 * @type {Object.<string, Money>}
                 */
                this.moneyHash = null;
                /**
                 * @type {ISendState}
                 */
                this.state = {
                    assetId: options.assetId || WavesApp.defaultAssets.WAVES,
                    mirrorId: user.getSetting('baseAssetId'),
                    outerSendMode: false,
                    gatewayDetails: null,
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
                /**
                 * @type {string}
                 */
                this.tab = options.mode;
                /**
                 * @type {boolean}
                 */
                this.strict = options.amount && options.recipient && options.strict;
                /**
                 * @type {boolean}
                 */
                this.errorOccured = false;

                try {
                    this.referrer = new URL(options.referrer).href;
                } catch (e) {
                    this.referrer = null;
                }

                if (!(options.mode || options.recipient || options.amount)) {
                    this.syncSettings({
                        tab: 'send.defaultTab'
                    });
                } else {
                    this.tab = 'singleSend';
                    this.state.singleSend.recipient = options.recipient;

                    Promise.all([
                        ds.moneyFromTokens(options.amount || '0', this.state.assetId),
                        waves.node.getFee({ type: WavesApp.TRANSACTION_TYPES.NODE.TRANSFER })
                    ]).then(([money, fee]) => {

                        this.state.singleSend.amount = money;
                        this.state.singleSend.fee = fee;

                        if (this.strict) {
                            this.nextStep();
                        }
                    })
                        .catch(() => {
                            this.errorOccured = true;
                            $scope.$digest();
                        });
                }

                this.receive(utils.observe(this.state, 'moneyHash'), this._onChangeMoneyHash, this);
                this.receive(utils.observe(this.state, 'assetId'), () => this.poll.restart());
            }

            back() {
                this.step--;
            }

            nextStep(tx) {
                const types = WavesApp.TRANSACTION_TYPES.NODE;
                const type = this.tab === 'singleSend' ? types.TRANSFER : types.MASS_TRANSFER;

                tx = tx || (this.tab === 'singleSend' ? { ...this.state.singleSend } : { ...this.state.massSend });

                this.txInfo = waves.node.transactions.createTransaction(type, {
                    ...tx,
                    sender: user.address
                });

                this.step++;
            }

            onTxSent(id) {
                if (this.referrer) {
                    location.href = `${this.referrer}?txId=${id}`;
                }
            }

            /**
             * @private
             */
            _onChangeMoneyHash() {
                const hash = this.state.moneyHash;
                const list = Object.values(hash)
                    .filter((money) => !money.getTokens().eq(0) && AssetSendCtrl._isNotScam(money));


                if (list.length) {
                    const availableBalancesHash = utils.toHash(list, 'asset.id');

                    if (!availableBalancesHash[this.state.assetId] && this.canChooseAsset) {
                        this.state.assetId = list[0].asset.id;
                    }

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
             * @return {boolean}
             * @private
             */
            static _isNotScam(item) {
                return !WavesApp.scam[item.asset.id];
            }

            /**
             * @param {string} assetId
             * @return {AssetSendCtrl.IMoneyProcessor}
             * @private
             */
            static _getAddMoneyProcessor(assetId) {
                return (hash) => {
                    if (!hash[assetId]) {
                        return ds.moneyFromTokens('0', assetId).then((money) => {
                            hash[assetId] = money;
                            return hash;
                        });
                    } else {
                        return hash;
                    }
                };
            }

        }

        return new AssetSendCtrl(this.locals);
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
 * @property {Money} fee
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
 * @property {boolean} outerSendMode
 * @property {IGatewayDetails} gatewayDetails
 * @property {Object.<string, Money>} moneyHash
 * @property {ISingleSendTx} singleSend
 * @property {IMassSendTx} massSend
 */

/**
 * @name IAssetSendCtrl
 */

/**
 * @typedef {object} IAssetSendCtrl#IOptions
 * @property {string} [assetId]
 * @property {boolean} [canChooseAsset]
 * @property {'singleSend'|'massSend'} [mode]
 * @property {string} [amount]
 * @property {string} [recipient]
 * @property {boolean} [strict]
 * @property {string} [referrer]
 */
