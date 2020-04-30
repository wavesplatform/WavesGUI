/* eslint-disable default-case */
(function () {
    'use strict';

    const { Money } = require('@waves/data-entities');
    const { BigNumber } = require('@waves/bignumber');

    /**
     * @param {BaseNodeComponent} BaseNodeComponent
     * @param {app.utils} utils
     * @param {User} user
     * @param {app.utils.decorators} decorators
     * @param {IPollCreate} createPoll
     * @return {Assets}
     */
    const factory = function (BaseNodeComponent, utils, user, decorators) {

        class Assets extends BaseNodeComponent {

            constructor() {
                super();

                user.onLogin().then(() => {
                    this._handleLogin();
                    user.loginSignal.on(this._handleLogin, this);

                    if (user.getSetting('scamListUrl')) {
                        this.stopScam();
                    } else {
                        this.giveMyScamBack();
                    }

                    if (user.getSetting('tokensNameListUrl')) {
                        this.tokensNameList();
                    } else {
                        this.giveMyTokensNameBack();
                    }
                });
            }

            /**
             * @param {string} address
             * @return {Promise<Assets.IWavesBalanceDetails>}
             */
            getBalanceByAddress(address) {
                return ds.api.assets.wavesBalance(address);
            }

            /**
             * Get asset info
             * @param {string} assetId
             * @return Promise<ExtendedAsset>
             */
            @decorators.cachable(5)
            info(assetId) {
                if (assetId === WavesApp.defaultAssets.WAVES || assetId === null) {
                    return Promise.all([
                        this.getAsset(assetId),
                        ds.fetch(`${this.node}/blockchain/rewards`)
                            .then(data => ({ quantity: data.totalWavesAmount }))
                            .catch(() => null)
                    ])
                        .then(([asset, assetData]) => {
                            if (assetData) {
                                Assets._updateAsset(asset, assetData);
                            }
                            return asset;
                        });
                }

                return Promise.all([
                    this.getAsset(assetId),
                    ds.fetch(`${this.node}/assets/details/${assetId}`)
                ]).then(([asset, assetData]) => {
                    Assets._updateAsset(asset, assetData);
                    return asset;
                });
            }

            getNft(limit) {
                return ds.api.assets.getNftList(user.address, limit);
            }

            /**
             * Get Asset info
             * @param {string} assetId
             * @return {Promise<Asset>}
             */
            getAsset(assetId) {
                return ds.api.assets.get(assetId);
            }

            /**
             * Get balance by asset id
             * @param {string} assetId
             * @return {Promise<IBalanceDetails>}
             */
            balance(assetId) {
                return this.balanceList([assetId])
                    .then(([asset]) => asset);
            }

            /**
             * @param {string} query
             * @return {JQuery.jqXHR}
             */
            search(query) {
                return $.get(`${WavesApp.network.api}/assets/search/${encodeURIComponent(query)}`, (data) => {
                    return data.map((item) => {
                        item.name = WavesApp.remappedAssetNames[item.id] || item.name;
                        return item;
                    });
                });
            }

            /**
             * Get balance list by asset id list
             * @param {string[]} assetIdList
             * @return {Promise<IBalanceDetails[]>}
             */
            balanceList(assetIdList) {
                return utils.whenAll([this.userBalances(), this._getEmptyBalanceList(assetIdList)])
                    .then(([balanceList, emptyBalanceList]) => {
                        const balances = utils.toHash(balanceList, 'available.asset.id');
                        return Promise.all(emptyBalanceList.map((money) => {
                            if (balances[money.asset.id]) {
                                return Promise.resolve(balances[money.asset.id]);
                            } else {
                                return this.info(money.asset.id).then(() => {
                                    return {
                                        asset: money.asset,
                                        regular: money,
                                        available: money,
                                        inOrders: money,
                                        leasedOut: money,
                                        leasedIn: money
                                    };
                                });
                            }
                        }));
                    });
            }

            /**
             * Get balance list by user address
             * @return {Promise<IBalanceDetails[]>}
             */
            userBalances() {
                return Promise.resolve([]);
            }

            giveMyScamBack() {
                user.scam = Object.create(null);
            }

            giveMyTokensNameBack() {
                user.tokensName = Object.create(null);
            }

            stopScam() {
                /**
                 * @type {Poll}
                 * @private
                 */
            }

            tokensNameList() {
                /**
                 * @type {Poll}
                 * @private
                 */
            }


            /**
             * @private
             */
            _handleLogin() {
                if (user.getSetting('scamListUrl')) {
                    this.stopScam();
                } else {
                    this.giveMyScamBack();
                }
            }

            /**
             * @return {Promise<Object.<string, boolean>>}
             * @private
             */
            _getScamAssetList() {
                return ds.fetch(`${user.getSetting('scamListUrl')}?${WavesApp.version}-${Date.now()}`)
                    .then((text) => {
                        const papa = require('papaparse');
                        const hash = Object.create(null);
                        papa.parse(text).data.forEach(([id]) => {
                            if (id) {
                                hash[id] = true;
                            }
                        });
                        return hash;
                    })
                    .catch(() => Object.create(null));
            }

            /**
             * @param hash
             * @private
             */
            _setScamAssetList(hash) {
                user.setScam(hash);
            }

            /**
             * @param {string[]} idList
             * @returns {Promise<Money[]>}
             * @private
             */
            _getEmptyBalanceList(idList) {
                return ds.api.assets.get(idList)
                    .then((list) => list.map(asset => new Money(0, asset)));
            }

            /**
             * @param {ExtendedAsset} asset
             * @param {{quantity: string, reissuable: boolean}} props
             * @private
             */
            static _updateAsset(asset, props) {
                asset.reissuable = props.reissuable;
                asset.quantity = new BigNumber(props.quantity);
            }

        }

        return utils.bind(new Assets());
    };

    factory.$inject = [
        'BaseNodeComponent',
        'utils',
        'user',
        'decorators'
    ];

    angular.module('app')
        .factory('assets', factory);
})();

/**
 * @typedef {object} IBalanceDetails
 * @property {Asset} asset
 * @property {Money} regular
 * @property {Money} available
 * @property {Money} inOrders
 * @property {Money} leasedOut
 * @property {Money} leasedIn
 */

/**
 * @name Assets
 *
 * @typedef {object} Assets#IWavesBalanceDetails
 * @property {ExtendedAsset} asset
 * @property {Money} regular
 * @property {Money} available
 * @property {Money} leasedOut
 * @property {Money} leasedIn
 */
