/* eslint-disable default-case */
(function () {
    'use strict';

    const entities = require('@waves/data-entities');

    /**
     * @param {BaseNodeComponent} BaseNodeComponent
     * @param {app.utils} utils
     * @param {User} user
     * @param {EventManager} eventManager
     * @param {app.utils.decorators} decorators
     * @param {IPollCreate} createPoll
     * @return {Assets}
     */
    const factory = function (BaseNodeComponent, utils, user, eventManager, decorators, createPoll) {

        class Assets extends BaseNodeComponent {

            constructor() {
                super();
                user.onLogin().then(() => {

                    if (!user.getSetting('withScam')) {
                        this.stopScam();
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
                if (assetId === WavesApp.defaultAssets.WAVES) {
                    return this.getAsset(assetId);
                }

                return Promise.all([
                    this.getAsset(assetId),
                    ds.fetch(`${this.node}/assets/details/${assetId}`)
                ]).then(([asset, assetData]) => {
                    Assets._updateAsset(asset, assetData);
                    return asset;
                });
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
                return $.get(`https://api.wavesplatform.com/assets/search/${encodeURIComponent(query)}`, (data) => {
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
                return ds.dataManager.getBalances();
            }

            giveMyScamBack() {
                WavesApp.scam = Object.create(null);
                if (this._pollScam) {
                    this._pollScam.destroy();
                    this._pollScam = null;
                }
            }

            stopScam() {
                if (this._pollScam) {
                    return null;
                }
                /**
                 * @type {Poll}
                 * @private
                 */
                this._pollScam = createPoll(this, this._getScamAssetList, this._setScamAssetList, 15000);
            }

            /**
             * @return {Promise<Object.<string, boolean>>}
             * @private
             */
            _getScamAssetList() {
                return ds.fetch(`${user.getSetting('scamListUrl')}?${Date.now()}`)
                    .then((text) => {
                        const papa = require('papaparse');
                        const hash = Object.create(null);
                        papa.parse(text).data.forEach(([id]) => {
                            if (id) {
                                hash[id] = true;
                            }
                        });
                        return hash;
                    });
            }

            /**
             * @param hash
             * @private
             */
            _setScamAssetList(hash) {
                WavesApp.scam = hash;
            }

            /**
             * @param {string[]} idList
             * @returns {Promise<Money[]>}
             * @private
             */
            _getEmptyBalanceList(idList) {
                return ds.api.assets.get(idList)
                    .then((list) => list.map(asset => new entities.Money(0, asset)));
            }

            /**
             * @param props
             * @return {*}
             * @private
             */
            static _remapAssetProps(props) {
                props.precision = props.decimals;
                delete props.decimals;
                return props;
            }

            /**
             * @param {ExtendedAsset} asset
             * @param {{quantity: string, reissuable: boolean}} props
             * @private
             */
            static _updateAsset(asset, props) {
                const divider = new BigNumber(10).pow(asset.precision);
                const quantity = new BigNumber(props.quantity).div(divider);

                asset.reissuable = props.reissuable;
                asset.quantity = quantity;
            }

        }

        return utils.bind(new Assets());
    };

    factory.$inject = [
        'BaseNodeComponent',
        'utils',
        'user',
        'eventManager',
        'decorators',
        'createPoll'
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
