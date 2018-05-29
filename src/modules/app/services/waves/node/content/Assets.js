/* eslint-disable default-case */
(function () {
    'use strict';

    /**
     * @param {BaseNodeComponent} BaseNodeComponent
     * @param {app.utils} utils
     * @param {User} user
     * @param {EventManager} eventManager
     * @param {app.utils.decorators} decorators
     * @param {PollCache} PollCache
     * @param {Aliases} aliases
     * @param {Matcher} matcher
     * @param {ExtendedAsset} ExtendedAsset
     * @return {Assets}
     */
    const factory = function (BaseNodeComponent, utils, user, eventManager, decorators, PollCache, aliases, matcher,
                              ExtendedAsset) {

        const TX_TYPES = WavesApp.TRANSACTION_TYPES.NODE;

        class Assets extends BaseNodeComponent {

            constructor() {
                super();
                user.onLogin().then(() => {
                    this._balanceCache = new PollCache({
                        getData: this._getBalances.bind(this),
                        timeout: 2000,
                        isBalance: true
                    });
                });
            }

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
                    fetch(`${this.network.node}/assets/details/${assetId}`)
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
                return fetch(`${WavesApp.network.api}/assets/${assetId}`)
                    .catch(() => {
                        if (assetId === Waves.constants.WAVES_PROPS.id) {
                            return Waves.constants.WAVES_V1_ISSUE_TX;
                        } else {
                            return fetch(`${this.network.node}/transactions/info/${assetId}`);
                        }
                    })
                    .then(Assets._remapAssetProps)
                    .then((assetData) => new ExtendedAsset(assetData));
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
                if (this._balanceCache) {
                    return this._balanceCache.get();
                } else {
                    return user.onLogin().then(() => this._balanceCache.get());
                }
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
             * @private
             */
            _getBalanceOrders() {
                return matcher.getOrders()
                    .then((orders) => orders.filter(Assets._filterOrders))
                    .then((orders) => orders.map(Assets._remapOrders));
            }

            /**
             * @return {Promise<IBalanceDetails[]>}
             * @private
             */
            _getBalances() {
                return Promise.all([
                    this._getAliases(),
                    this._getWavesBalanceDetails(),
                    this._getUserAssets(),
                    this._getBalanceOrders()
                ]).then(Assets._remapBalance);
            }

            /**
             * @return {Promise<Array<string>>}
             * @private
             */
            _getAliases() {
                const char = this.network.code;
                return fetch(`${this.network.node}/alias/by-address/${user.address}`)
                    .then((aliases) => aliases.map((alias) => alias.replace(`alias:${char}:`, '')))
                    .catch(() => aliases.getAliasList());
            }

            /**
             * @param {string} [address]
             * @return {Promise<Assets.IWavesBalanceDetails>}
             * @private
             */
            _getWavesBalanceDetails(address) {
                const url = `${this.network.node}/addresses/balance/details/${address || user.address}`;
                return this.getExtendedAsset(WavesApp.defaultAssets.WAVES)
                    .then((asset) => {
                        return fetch(url)
                            .then(({ available, effective, regular }) => {

                                const regularMoney = new Waves.Money(String(regular || 0), asset);
                                const availableMoney = new Waves.Money(String(available || 0), asset);
                                const effectiveMoney = new Waves.Money(String(effective || 0), asset);

                                return {
                                    asset,
                                    regular: regularMoney,
                                    available: availableMoney,
                                    leasedOut: regularMoney.sub(availableMoney),
                                    leasedIn: effectiveMoney.sub(availableMoney)
                                };
                            });
                    });
            }

            /**
             * @return {Promise<Money[]>}
             * @private
             */
            _getUserAssets() {
                return fetch(`${this.network.node}/assets/balance/${user.address}`)
                    .then(({ balances }) => this._remapAssetsList(balances));
            }

            /**
             * @param {Array<{assetId: string, balance: string|number}>} balances
             * @return {Promise<Money[]>}
             * @private
             */
            _remapAssetsList(balances) {
                const promiseList = balances.map(({ assetId, balance }) => {
                    return this.getExtendedAsset(assetId)
                        .then((asset) => new Waves.Money(String(balance), asset));
                });

                return Promise.all(promiseList);
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
             * @param order
             * @returns {*}
             * @private
             */
            static _remapOrders(order) {
                const amountWithoutFilled = order.amount.sub(order.filled);

                switch (order.type) {
                    case 'sell':
                        return amountWithoutFilled;
                    case 'buy':
                        return (
                            order
                                .price
                                .cloneWithTokens(
                                    amountWithoutFilled
                                        .getTokens()
                                        .mul(order.price.getTokens())
                                )
                        );
                }
            }

            /**
             * @param {string} status
             * @return {boolean}
             * @private
             */
            static _filterOrders({ status }) {
                return status === 'Accepted' || status === 'PartiallyFilled';
            }

            /**
             * @param {Array<string>} aliasList
             * @param {Assets.IWavesBalanceDetails} wavesDetails
             * @param {Array<Money>} moneyList
             * @param {Array<Money>} orderMoneyList
             * @return {IBalanceDetails[]}
             * @private
             */
            static _remapBalance([aliasList, wavesDetails, moneyList, orderMoneyList]) {
                const orderMoneyHash = utils.groupMoney(orderMoneyList);
                const eventsMoneyHash = utils.groupMoney(eventManager.getReservedMoneyList());
                const regularMoney = wavesDetails.regular;
                const wavesTx = eventsMoneyHash[WavesApp.defaultAssets.WAVES] || regularMoney.cloneWithCoins('0');
                const wavesOrder = orderMoneyHash[WavesApp.defaultAssets.WAVES] || regularMoney.cloneWithCoins('0');

                aliases.aliases = aliasList;

                moneyList = moneyList.sort(utils.comparators.process((money) => money.asset.name).asc);

                return [{
                    asset: wavesDetails.asset,
                    regular: Assets._getMoneySub(regularMoney, wavesTx),
                    available: Assets._getMoneySub(wavesDetails.available, wavesTx, wavesOrder),
                    inOrders: wavesOrder,
                    leasedOut: wavesDetails.leasedOut,
                    leasedIn: wavesDetails.leasedIn
                }].concat(moneyList.map(Assets._remapAssetsMoney(orderMoneyHash, eventsMoneyHash)));
            }

            /**
             * @param orderMoneyHash
             * @param eventsMoneyHash
             * @return {Function}
             * @private
             */
            static _remapAssetsMoney(orderMoneyHash, eventsMoneyHash) {
                return function (money) {
                    const eventsMoney = eventsMoneyHash[money.asset.id] || money.cloneWithCoins('0');
                    const inOrders = orderMoneyHash[money.asset.id] || money.cloneWithCoins('0');

                    return {
                        asset: money.asset,
                        regular: Assets._getMoneySub(money, eventsMoney),
                        available: Assets._getMoneySub(money, eventsMoney, inOrders),
                        inOrders,
                        leasedOut: money.cloneWithCoins('0'),
                        leasedIn: money.cloneWithCoins('0')
                    };
                };
            }

            /**
             *
             * @param {Money} money
             * @param {Money[]} toSubMoneyList
             * @return {*}
             * @private
             */
            static _getMoneySub(money, ...toSubMoneyList) {
                const result = toSubMoneyList.reduce((result, toSub) => {
                    return result.sub(toSub);
                }, money);
                if (result.getTokens().lt(0)) {
                    return result.cloneWithCoins('0');
                } else {
                    return result;
                }
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
        'PollCache',
        'aliases',
        'matcher',
        'ExtendedAsset'
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
