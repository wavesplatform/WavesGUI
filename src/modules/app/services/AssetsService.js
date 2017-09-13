(function () {
    'use strict';

    /**
     * @param apiWorker
     * @param decorators
     * @param {User} user
     * @return {AssetsService}
     */
    const factory = function (apiWorker, decorators, user, $q, utils) {

        const ASSET_NAME_MAP = {
            'WETH': 'Ethereum',
            'WEUR': 'Euro',
            'WUSD': 'Usd',
            'WBitcoin': 'Bitcoin'
        };

        class AssetsService {

            /**
             * @param {string} assetId
             * @return {Promise<IAssetInfo>}
             */
            @decorators.cachable()
            getAssetInfo(assetId) {
                if (assetId === 'WAVES') {
                    return user.onLogin()
                        .then(() => ({
                            id: 'WAVES',
                            name: 'Waves',
                            precision: 8,
                            reissuable: false,
                            quantity: 100000000,
                            timestamp: 0
                        }));
                }
                return user.onLogin()
                    .then(() => {
                        return apiWorker.process((Waves, data) => {
                            const { assetId } = data;
                            return Waves.API.Node.v1.transactions.get(assetId);
                        }, { assetId })
                            .then((asset) => ({
                                id: asset.id,
                                name: this._getAssetName(asset.name),
                                description: asset.description,
                                precision: asset.decimals,
                                reissuable: asset.reissuable,
                                quantity: asset.quantity,
                                timestamp: asset.timestamp
                            }));
                    });
            }

            /**
             * @param {string} assetId
             * @return {Promise<IAssetWithBalance>}
             */
            @decorators.cachable(2000)
            getBalance(assetId) {
                return this.getAssetInfo(assetId)
                    .then((info) => {
                        const handler = (Waves, data) => {
                            const { address, assetId } = data;
                            return Waves.API.Node.v1.assets.balance(address, assetId);
                        };
                        const data = { address: user.address, assetId: info.id };

                        return apiWorker.process(handler, data)
                            .then((data) => {
                                return { ...info, balance: data.balance };
                            });
                    });
            }

            /**
             * @param {string} name
             * @return {string}
             * @private
             */
            _getAssetName(name) {
                return ASSET_NAME_MAP[name] || name;
            }

        }

        return utils.bind(new AssetsService());
    };

    factory.$inject = ['apiWorker', 'decorators', 'user', '$q', 'utils'];

    angular.module('app')
        .factory('assetsService', factory);
})();

/**
 * @typedef {Object} IAssetInfo
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {number} precision
 * @property {boolean} reissuable
 * @property {number} quantity
 * @property {number} timestamp
 */

/**
 * @typedef {Object} IAssetWithBalance
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {number} precision
 * @property {number} balance
 * @property {boolean} reissuable
 * @property {number} quantity
 * @property {number} timestamp
 */
