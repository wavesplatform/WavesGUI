(function () {
    'use strict';

    const ASSET_NAME_MAP = {
        [WavesApp.defaultAssets.ETH]: 'Ethereum',
        [WavesApp.defaultAssets.EUR]: 'Euro',
        [WavesApp.defaultAssets.USD]: 'US Dollar',
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
                return fetch(`https://api.wavesplatform.com/assets/${assetId}`)
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
                return this.balanceList([assetId])
                    .then(([asset]) => asset);
            }

            /**
             * Get balance list by asset id list
             * @param {string[]} assetIdList
             * @return {Promise<IAssetWithBalance[]>}
             */
            balanceList(assetIdList) {
                return utils.whenAll([
                    utils.whenAll(assetIdList.map(this.info, this)),
                    this._getBalances()
                ])
                    .then(([assetList, balanceList]) => {
                        const balances = utils.toHash(balanceList, 'id');
                        return assetList.map((asset) => {
                            if (balances[asset.id]) {
                                const balance = this._getAssetBalance(balances[asset.id].amount);
                                return utils.when({ ...asset, balance });
                            } else {
                                return Waves.Money.fromTokens('0', asset.id)
                                    .then((money) => ({ ...asset, balance: money }));
                            }
                        });
                    })
                    .then(utils.whenAll);
            }

            /**
             * Get balance list by user address
             * @return {Promise<IAssetWithBalance[]>}
             */
            userBalances() {
                return this._getBalances()
                    .then((balanceList) => {
                        return utils.whenAll(balanceList.map((balance) => this.info(balance.id)))
                            .then((assetList) => {
                                return assetList.map((asset, index) => {
                                    const amount = balanceList[index].amount;
                                    const balance = this._getAssetBalance(amount);
                                    return { ...asset, balance };
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
                return this.getFee('transfer', fee)
                    .then((fee) => {
                        return Waves.API.Node.v1.assets.transfer({
                            amount: amount.toCoins(),
                            assetId: amount.asset.id,
                            fee: fee.toCoins(),
                            feeAssetId: fee.asset.id,
                            recipient,
                            attachment
                        }, keyPair)
                            .then(this._pipeTransaction([amount, fee]));
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
             * @param {Money} money
             * @return {Money}
             * @private
             */
            _getAssetBalance(money) {
                return eventManager.updateBalance(money);
            }

        }

        return new Assets();
    };

    factory.$inject = ['BaseNodeComponent', 'utils', 'user', 'eventManager', 'decorators'];

    angular.module('app')
        .factory('assets', factory);
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
