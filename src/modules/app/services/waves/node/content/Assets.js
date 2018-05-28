/* eslint-disable default-case */
(function () {
    'use strict';

    /**
     * @param {BaseNodeComponent} BaseNodeComponent
     * @param {app.utils} utils
     * @param {User} user
     * @param {EventManager} eventManager
     * @param {app.utils.decorators} decorators
     * @return {Assets}
     */
    const factory = function (BaseNodeComponent, utils, user, eventManager, decorators) {

        const TX_TYPES = WavesApp.TRANSACTION_TYPES.NODE;

        class Assets extends BaseNodeComponent {

            initializeAssetFactory() {
                Waves.config.set({
                    /**
                     * @param {string} id
                     * @return {Promise<ExtendedAsset>}
                     */
                    assetFactory: (id) => {
                        return this.getExtendedAsset(id);
                    }
                });
            }

            /**
             * @param {string} address
             * @return {Promise<Assets.IWavesBalanceDetails>}
             */
            getBalanceByAddress(address) {
                return this._getWavesBalanceDetails(address);
            }

            /**
             * Get asset info
             * @param {string} assetId
             * @return Promise<ExtendedAsset>
             */
            @decorators.cachable(5)
            info(assetId) {
                if (assetId === WavesApp.defaultAssets.WAVES) {
                    return this.getExtendedAsset(assetId);
                }
                return Promise.all([
                    this.getExtendedAsset(assetId),
                    ds.fetch(`${this.network.node}/assets/details/${assetId}`)
                ]).then(([asset, assetData]) => {
                    Assets._updateAsset(asset, assetData);
                    return asset;
                });
            }

            /**
             * Get Asset info
             * @param {string} assetId
             * @return {Promise<ExtendedAsset>}
             */
            @decorators.cachable()
            getExtendedAsset(assetId) {
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
                return $.get(`https://api.wavesplatform.com/assets/search/${query}`, (data) => {
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
                return ds.balanceManager.getBalances();
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
                return this.getFee({ type: TX_TYPES.TRANSFER, fee })
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


            massTransfer({ fee, transfers, attachment, keyPair }) {
                return this.getFee({ type: WavesApp.TRANSACTION_TYPES.NODE.MASS_TRANSFER, tx: { transfers }, fee })
                    .then((fee) => {
                        return Waves.API.Node.v1.transactions.massTransfer({
                            fee: fee.toCoins(),
                            attachment,
                            assetId: transfers[0].amount.asset.id,
                            transfers: transfers.map(({ recipient, amount }) => ({
                                recipient,
                                amount: amount.toCoins()
                            }))
                        }, keyPair);
                    });
            }

            /**
             * Create issue transaction
             * @param {string} name
             * @param {string} description
             * @param {BigNumber} quantity count of tokens from new asset
             * @param {number} precision num in range from 0 to 8
             * @param {boolean} reissuable can reissue token
             * @param {Seed.keyPair} keyPair
             * @param {Money} [fee]
             * @return {Promise<ITransaction>}
             */
            issue({ name, description, quantity, precision, reissuable, fee, keyPair }) {
                quantity = quantity.mul(Math.pow(10, precision));
                return this.getFee({ type: TX_TYPES.ISSUE, fee }).then((fee) => {
                    return Waves.API.Node.v1.assets.issue({
                        name,
                        description,
                        precision,
                        reissuable,
                        quantity: quantity.toFixed(),
                        fee
                    }, keyPair)
                        .then(this._pipeTransaction([fee]));
                });
            }

            /**
             * Create reissue transaction
             */
            reissue({ quantity, reissuable, fee, keyPair }) {
                return this.getFee({ type: TX_TYPES.REISSUE, fee }).then((fee) => Waves.API.Node.v1.assets.reissue({
                    assetId: quantity.asset.id,
                    fee: fee.toCoins(),
                    quantity: quantity.toCoins(),
                    reissuable
                }, keyPair));
            }

            /**
             * Create burn transaction
             */
            burn({ quantity, fee, keyPair }) {
                return this.getFee({ type: TX_TYPES.BURN, fee }).then((fee) => Waves.API.Node.v1.assets.burn({
                    quantity: quantity.toCoins(),
                    fee: fee.toCoins(),
                    assetId: quantity.asset.id
                }, keyPair));
            }

            distribution() {

            }

            /**
             * @param {string[]} idList
             * @returns {Promise<any[]>}
             * @private
             */
            _getEmptyBalanceList(idList) {
                return Promise.all(idList.map((id) => {
                    return this.getExtendedAsset(id)
                        .then((asset) => new Waves.Money('0', asset));
                }));
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
