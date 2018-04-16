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
                    fetch(`${user.getSetting('network.node')}/assets/details/${assetId}`)
                        .then(utils.onFetch)
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
            @decorators.cachable()
            getExtendedAsset(assetId) {
                return fetch(`${WavesApp.network.api}/assets/${assetId}`)
                    .then(utils.onFetch)
                    .catch(() => {
                        if (assetId === Waves.constants.WAVES_PROPS.id) {
                            return Waves.constants.WAVES_V1_ISSUE_TX;
                        } else {
                            return fetch(`${user.getSetting('network.node')}/transactions/info/${assetId}`)
                                .then(utils.onFetch);
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
                return user.onLogin().then(() => this._balanceCache.get());
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
                return this.getFee('issue', fee).then((fee) => {
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
                return this.getFee('reissue', fee).then((fee) => Waves.API.Node.v1.assets.reissue({
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
                return this.getFee('burn', fee).then((fee) => Waves.API.Node.v1.assets.burn({
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
             * @return {Promise<Response>}
             * @private
             */
            _getUserAssetBalances() {
                return fetch(`${user.getSetting('network.node')}/assets/balance/${user.address}`)
                    .then(utils.onFetch)
                    .then(({ balances }) => this._remapBalanceList(balances));
            }

            /**
             * @return {Promise<IBalanceDetails[]>}
             * @private
             */
            _getBalances() {
                return Promise.all([
                    Waves.API.Node.v2.addresses.get(user.address),
                    this._getUserAssetBalances(),
                    this._getBalanceOrders()
                ]).then(Assets._remapBalance);
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
             * @param balances
             * @return {Promise<Money[]>}
             * @private
             */
            _remapBalanceList(balances) {
                return Promise.all(balances.map((balance) => {
                    const id = balance.assetId;

                    const _create = (asset) => {

                        Assets._updateAsset(asset, {
                            quantity: balance.quantity,
                            reissuable: balance.reissuable
                        });

                        return Promise.resolve(new Waves.Money(String(balance.balance), asset));
                    };

                    return this.getExtendedAsset(id).then(_create);
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
             * @param wavesDetails
             * @param moneyList
             * @param orderMoneyList
             * @return {IBalanceDetails[]}
             * @private
             */
            static _remapBalance([wavesDetails, moneyList, orderMoneyList]) {
                const orderMoneyHash = utils.groupMoney(orderMoneyList);
                const eventsMoneyHash = utils.groupMoney(eventManager.getReservedMoneyList());

                const wavesNodeRegular = wavesDetails.wavesBalance.regular;
                const wavesNodeAvailable = wavesDetails.wavesBalance.available;
                const wavesTx = eventsMoneyHash[WavesApp.defaultAssets.WAVES] || wavesNodeRegular.cloneWithCoins('0');
                const wavesOrder = orderMoneyHash[WavesApp.defaultAssets.WAVES] || wavesNodeRegular.cloneWithCoins('0');

                aliases.aliases = wavesDetails.aliases;
                moneyList = moneyList.sort(utils.comparators.process((money) => money.asset.name).asc);

                return [{
                    asset: wavesNodeRegular.asset,
                    regular: Assets._getMoneySub(wavesNodeRegular, wavesTx),
                    available: Assets._getMoneySub(wavesNodeAvailable, wavesTx, wavesOrder),
                    inOrders: wavesOrder,
                    leasedOut: wavesDetails.wavesBalance.leasedOut,
                    leasedIn: wavesDetails.wavesBalance.leasedIn
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
