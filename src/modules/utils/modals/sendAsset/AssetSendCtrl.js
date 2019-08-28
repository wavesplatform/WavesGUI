(function () {
    'use strict';

    const { SIGN_TYPE } = require('@waves/signature-adapter');

    /**
     * @param $scope
     * @param {Waves} waves
     * @param {Base} Base
     * @param {app.utils} utils
     * @param {User} user
     * @param {$mdDialog} $mdDialog
     * @param {BalanceWatcher} balanceWatcher
     * @return {AssetSendCtrl}
     */
    const controller = function ($scope, waves, Base, utils, user, $mdDialog, balanceWatcher) {

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
                    singleSend: utils.liteObject({ type: SIGN_TYPE.TRANSFER }),
                    massSend: utils.liteObject({ type: SIGN_TYPE.MASS_TRANSFER }),
                    toBankMode: false
                };
                this.receive(balanceWatcher.change, this._updateBalanceList, this);
                this._updateBalanceList();
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
                    this.state.singleSend.attachment = options.attachment;

                    const toGateway = this.outerSendMode && this.gatewayDetails;
                    const attachment = toGateway ? this.gatewayDetails.attachment : options.attachment;
                    const attachmentString = attachment ? attachment.toString() : '';
                    const bytesAttachment = utils.stringToBytes(attachmentString);

                    Promise.all([
                        ds.moneyFromTokens(options.amount || '0', this.state.assetId),
                        waves.node.getFee({ type: SIGN_TYPE.TRANSFER })
                    ]).then(([money, fee]) => {

                        this.state.singleSend.amount = money;
                        this.state.singleSend.fee = fee;

                        const tx = waves.node.transactions.createTransaction({
                            ...this.state.singleSend,
                            attachment: bytesAttachment
                        });
                        const signable = ds.signature.getSignatureApi().makeSignable({
                            type: SIGN_TYPE.TRANSFER,
                            data: tx
                        });

                        if (this.strict) {
                            this.nextStep(signable);
                        }
                    })
                        .catch(() => {
                            this.errorOccured = true;
                            $scope.$digest();
                        });
                }

                this.receive(utils.observe(this.state, 'moneyHash'), this._onChangeMoneyHash, this);
            }

            back() {
                this.step--;
            }

            nextStep(signable) {
                this.signable = signable;
                this.step++;
            }

            onTxSent(id) {
                if (this.referrer) {
                    utils.redirect(`${this.referrer}?txId=${id}`);
                    $mdDialog.hide();
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
            _updateBalanceList() {
                const hash = balanceWatcher.getBalance();

                const loadBalances = [this.state.assetId, this.state.mirrorId].reduce((acc, assetId) => {
                    return acc.then(hash => {
                        if (hash[assetId]) {
                            return Promise.resolve(hash);
                        }
                        return balanceWatcher.getBalanceByAssetId(assetId)
                            .then(money => {
                                hash[assetId] = money;
                                return hash;
                            });
                    });
                }, Promise.resolve(hash));

                loadBalances.then(hash => {
                    this.state.moneyHash = hash;
                    utils.safeApply($scope);
                });
            }

            /**
             * @return {boolean}
             * @private
             */
            static _isNotScam(item) {
                return !user.scam[item.asset.id];
            }

        }

        return new AssetSendCtrl(this.locals);
    };

    controller.$inject = [
        '$scope',
        'waves',
        'Base',
        'utils',
        'user',
        '$mdDialog',
        'balanceWatcher'
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
 * @property {number} type
 * @property {string} recipient
 * @property {Money} amount
 * @property {Money} fee
 * @property {string} attachment
 * @property {string | null} assetId
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
 * @property {boolean} toBankMode
 * @property {IGatewayDetails} gatewayDetails
 * @property {Object.<string, Money>} moneyHash
 * @property {ISingleSendTx} singleSend
 * @property {IMassSendTx} massSend
 * @property {string} warning
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
