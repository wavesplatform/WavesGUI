(function () {
    'use strict';

    const ASSET_NAME_MAP = {
        [WavesApp.defaultAssets.ETH]: 'Ethereum',
        [WavesApp.defaultAssets.EUR]: 'Euro',
        [WavesApp.defaultAssets.USD]: 'USD',
        [WavesApp.defaultAssets.BTC]: 'Bitcoin'
    };

    /**
     * @param {BaseNodeComponent} BaseNodeComponent
     * @param {app.utils} utils
     * @param {User} user
     * @param {EventManager} eventManager
     * @param {app.utils.decorators} decorators
     * @return {Assets}
     */
    const factory = function (BaseNodeComponent, utils, user, eventManager, decorators) {

        class Assets extends BaseNodeComponent {

            /**
             * Get Asset info
             * @param {string} assetId
             * @return {Promise<IAssetInfo>}
             */
            @decorators.cachable()
            info(assetId) {
                return fetch(`${WavesApp.network.api}/assets/${assetId}`)
                    .then(utils.onFetch)
                    .then((info) => {
                        return Waves.Money.fromCoins(String(info.quantity), info.id)
                            .then((money) => ({
                                id: info.id,
                                name: ASSET_NAME_MAP[info.id] || info.name,
                                description: info.id !== WavesApp.defaultAssets.WAVES ? info.description : '',
                                precision: info.decimals,
                                reissuable: info.reissuable,
                                quantity: money,
                                timestamp: info.timestamp,
                                sender: info.sender,
                                height: info.height,
                                ticker: info.ticker || '',
                                sign: info.sign || ''
                            }));
                    });
            }

            /**
             * Get balance by asset id
             * @param {string} assetId
             * @return {Promise<IAssetWithBalance>}
             */
            balance(assetId) {
                return this.balanceList([assetId]).then(([asset]) => asset);
            }

            /**
             * Get balance list by asset id list
             * @param {string[]} assetIdList
             * @return {Promise<IAssetWithBalance[]>}
             */
            balanceList(assetIdList) {
                return utils.whenAll([
                    utils.whenAll(assetIdList.map(this.info, this)),
                    this._getBalances(),
                    eventManager.getBalanceEvents()
                ])
                    .then(([assetList, balanceList, events]) => {
                        const balances = utils.toHash(balanceList, 'id');
                        return assetList.map((asset) => {
                            if (balances[asset.id]) {
                                const tokens = this._getAssetBalance(asset.id, balances[asset.id].amount, events);
                                return Waves.Money.fromTokens(tokens.toFixed(asset.precision), asset.id)
                                    .then((money) => ({ ...asset, balance: money }));
                            } else {
                                return Waves.Money.fromTokens('0', asset.id)
                                    .then((money) => ({ ...asset, balance: money }));
                            }
                        });
                    }).then(utils.whenAll);
            }

            /**
             * Get balance list by user address
             * @return {Promise<IAssetWithBalance[]>}
             */
            userBalances() {
                return utils.whenAll([
                    this._getBalances(),
                    eventManager.getBalanceEvents()
                ]).then(([balanceList, events]) => {
                    return utils.whenAll(balanceList.map((balance) => this.info(balance.id)))
                        .then((assetList) => {
                            return assetList.map((asset, index) => {
                                const amount = balanceList[index].amount;
                                const balance = this._getAssetBalance(asset.id, amount, events);
                                return Waves.Money.fromTokens(balance.toFixed(asset.precision), asset.id)
                                    .then((money) => ({ ...asset, balance: money }));
                            });
                        })
                        .then(utils.whenAll);
                });
            }

            /**
             * Get list of min values fee
             * @param {string} type
             * @return {Promise<Money[]>}
             */
            fee(type) {
                return this._feeList(type);
            }

            /**
             * Create transfer transaction
             * @param {Money} amount
             * @param {Money} [fee]
             * @param {string} recipient
             * @param {string} attachment
             * @param {string} keyPair
             * @return {Promise<{id: string}>}
             */
            transfer({ amount, fee, recipient, attachment, keyPair }) {
                this.getFee('transfer', fee)
                    .then((fee) => {
                        return Waves.API.Node.v1.assets.transfer({
                            amount: amount.toCoins(),
                            assetId: amount.asset.id,
                            fee: fee.toCoins(),
                            feeAssetId: fee.asset.id,
                            keyPair,
                            recipient,
                            attachment
                        }).then(this._pipeTransaction([amount, fee]));
                    });
            }

            /**
             * Create issue transaction
             */
            issue() {

            }

            /**
             * Create reissue transaction
             */
            reissue() {

            }

            /**
             * Create burn transaction
             */
            burn() {

            }

            distribution() {

            }

            /**
             * @return {Promise<IAssetWithBalance[]>}
             * @private
             */
            @decorators.cachable(1)
            _getBalances() {
                return Waves.API.Node.v2.addresses.balances(user.address);
            }

            /**
             * @param {string} assetId
             * @param {Money} money
             * @param {Array<BalanceComponent>} events
             * @return {BigNumber}
             * @private
             */
            _getAssetBalance(assetId, money, events) {
                return events.reduce((balance, balanceEvent) => {
                    return balance.sub(balanceEvent.getBalanceDifference(assetId));
                }, money.getTokens());
            }

        }

        return new Assets();
    };

    factory.$inject = ['BaseNodeComponent', 'utils', 'user', 'eventManager', 'decorators'];

    angular.module('app').factory('assets', factory);
})();

/**
 * @typedef {object} IAssetInfo
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {number} precision
 * @property {boolean} reissuable
 * @property {Money} quantity
 * @property {number} timestamp
 * @property {number} height
 * @property {string} ticker
 * @property {string} sign
 */
/**
 * @typedef {object} IAssetWithBalance
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {number} precision
 * @property {BigNumber} balance
 * @property {boolean} reissuable
 * @property {Money} quantity
 * @property {number} timestamp
 * @property {number} height
 * @property {string} ticker
 * @property {string} sign
 */
