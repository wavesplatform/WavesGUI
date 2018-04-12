(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @param {User} user
     * @param {app.utils} utils
     * @param {IPollCreate} createPoll
     * @param $scope
     * @param {JQuery} $element
     * @param {INotification} notification
     * @param {DexDataService} dexDataService
     * @return {CreateOrder}
     */
    const controller = function (Base, waves, user, utils, createPoll, $scope,
                                 $element, notification, dexDataService) {

        class CreateOrder extends Base {

            /**
             * @return {string}
             */
            get amountDisplayName() {
                return this.amountBalance && this.amountBalance.asset.displayName || '';
            }

            /**
             * @return {string}
             */
            get priceDisplayName() {
                return this.priceBalance && this.priceBalance.asset.displayName || '';
            }

            constructor() {
                super();

                /**
                 * Expanded state
                 * @type {number}
                 */
                this.step = 0;
                /**
                 * Max amount (with fee)
                 * @type {Money}
                 */
                this.maxAmountBalance = null;
                /**
                 * Has price balance for buy amount
                 * @type {boolean}
                 */
                this.canBuyOrder = true;
                /**
                 * Amount asset balance
                 * @type {Money}
                 */
                this.amountBalance = null;
                /**
                 * Price asset balance
                 * @type {Money}
                 */
                this.priceBalance = null;
                /**
                 * Order type
                 * @type {string}
                 */
                this.type = null;
                /**
                 * Total price (amount multiply price)
                 * @type {Money}
                 */
                this.totalPrice = null;
                /**
                 * @type {{amount: string, price: string}}
                 * @private
                 */
                this._assetIdPair = null;
                /**
                 * @type {Money}
                 */
                this.amount = null;
                /**
                 * @type {Money}
                 */
                this.price = null;

                Waves.Money.fromTokens('0.003', WavesApp.defaultAssets.WAVES).then((money) => {
                    this.fee = money;
                });

                this.receive(dexDataService.chooseOrderBook, ({ type, price, amount }) => {
                    this.amount = this.amountBalance.cloneWithTokens(amount);
                    this.price = this.priceBalance.cloneWithTokens(price);
                    this.expand(type);
                    $scope.$apply();
                });

                this.syncSettings({
                    _assetIdPair: 'dex.assetIdPair'
                });

                /**
                 * @type {Poll}
                 */
                const balancesPoll = createPoll(this, this._getBalances, this._setBalances, 1000);
                /**
                 * @type {Poll}
                 */
                const spreadPoll = createPoll(this, this._getData, this._setData, 1000);

                this.observe('_assetIdPair', () => {
                    this.amount = null;
                    this.price = null;
                    this.bid = null;
                    this.ask = null;
                    balancesPoll.restart();
                    spreadPoll.restart();
                    this.maxAmountBalance = CreateOrder._getMaxAmountBalance(this.type, this.amount, this.fee);
                    this.observeOnce(['bid', 'ask'], utils.debounce(() => {
                        if (this.type) {
                            this.price = this._getCurrentPrice();
                            $scope.$apply();
                        }
                    }));
                });

                this.observe(['amount', 'price', 'step', 'type'], this._currentTotal);

                // TODO Add directive for stop propagation (catch move for draggable)
                $element.on('mousedown touchstart', '.body', (e) => {
                    e.stopPropagation();
                });
            }

            expand(type) {
                this.type = type;
                this.step = 1;
                this.maxAmountBalance = this._getMaxAmountBalance();
                this.price = this._getCurrentPrice();

                $scope.$$postDigest(() => {
                    $element.find('input[name="amount"]').focus();
                });
            }

            setMaxAmount() {
                if (this.amountBalance.asset.id === this.fee.asset.id) {
                    const amount = this.amountBalance.cloneWithTokens(this.amountBalance.sub(this.fee).getTokens()
                        .round(this.amountBalance.asset.precision, BigNumber.ROUND_FLOOR));
                    if (amount.getTokens().lt(0)) {
                        this.amount = this.amountBalance.cloneWithTokens('0');
                    } else {
                        this.amount = amount;
                    }
                } else {
                    this.amount = this.amountBalance.cloneWithTokens(this.amountBalance.getTokens()
                        .round(this.amountBalance.asset.precision, BigNumber.ROUND_FLOOR));
                }
            }

            setMaxPrice() {
                if (this.priceBalance.asset.id === this.fee.asset.id) {
                    if (this.price.getTokens().eq(0)) {
                        this.amount = this.amountBalance.cloneWithTokens('0');
                    } else {
                        const amount = this.amountBalance.cloneWithTokens(this.priceBalance.sub(this.fee)
                            .getTokens()
                            .div(this.price.getTokens())
                            .round(this.amountBalance.asset.precision, BigNumber.ROUND_FLOOR));
                        if (amount.getTokens().lt(0)) {
                            this.amount = amount.cloneWithTokens('0');
                        } else {
                            this.amount = amount;
                        }
                    }
                } else {
                    this.amount = this.amountBalance.cloneWithTokens(this.priceBalance.getTokens()
                        .div(this.price.getTokens())
                        .round(this.amountBalance.asset.precision, BigNumber.ROUND_FLOOR));
                }
            }

            collapse() {
                this.type = null;
                this.step = 0;
            }

            createOrder(form) {
                return user.getSeed()
                    .then((seed) => {
                        return Waves.AssetPair.get(this._assetIdPair.amount, this._assetIdPair.price).then((pair) => {
                            return Waves.OrderPrice.fromTokens(this.price.getTokens(), pair);
                        }).then((price) => {
                            const amount = this.amount;
                            this.amount = null;
                            form.$setUntouched();
                            $scope.$apply();
                            return waves.matcher.createOrder({
                                amountAsset: this.amountBalance.asset.id,
                                priceAsset: this.priceBalance.asset.id,
                                orderType: this.type,
                                price: price.toMatcherCoins(),
                                amount: amount.toCoins()
                            }, seed.keyPair);
                        }).then(() => {
                            const pair = `${this.amountBalance.asset.id}/${this.priceBalance.asset.id}`;
                            analytics.push('DEX', `DEX.Order.${this.type}.Success`, pair);
                            notification.success({
                                ns: 'app.dex',
                                title: { literal: 'directives.createOrder.notifications.isCreated' }
                            });
                        }).catch((err) => {
                            const pair = `${this.amountBalance.asset.id}/${this.priceBalance.asset.id}`;
                            analytics.push('DEX', `DEX.Order.${this.type}.Error`, pair);
                            // TODO : refactor this
                            const notEnough = 'Not enough tradable balance';
                            const isNotEnough = (err.data.message.slice(0, notEnough.length) === notEnough);
                            notification.error({
                                ns: 'app.dex',
                                title: {
                                    literal: isNotEnough ?
                                        'directives.createOrder.notifications.notEnoughBalance' :
                                        'directives.createOrder.notifications.somethingWendWrong'
                                }
                            });
                        });
                    });
            }

            /**
             * @return {Money}
             * @private
             */
            _getCurrentPrice() {
                switch (this.type) {
                    case 'sell':
                        return this.priceBalance.cloneWithTokens(String(this.bid && this.bid.price || 0));
                    case 'buy':
                        return this.priceBalance.cloneWithTokens(String(this.ask && this.ask.price || 0));
                    default:
                        throw new Error('Wrong type');
                }
            }

            /**
             * @return {Promise<IAssetPair>}
             * @private
             */
            _getBalances() {
                return Waves.AssetPair.get(this._assetIdPair.amount, this._assetIdPair.price).then((pair) => {
                    return utils.whenAll([
                        waves.node.assets.balance(pair.amountAsset.id),
                        waves.node.assets.balance(pair.priceAsset.id)
                    ]).then(([amountMoney, priceMoney]) => ({
                        amountBalance: amountMoney.available,
                        priceBalance: priceMoney.available
                    }));
                });
            }

            /**
             * @param data
             * @private
             */
            _setBalances(data) {
                if (data) {
                    this.amountBalance = data.amountBalance;
                    this.priceBalance = data.priceBalance;
                    this.maxAmountBalance = this._getMaxAmountBalance();
                }
            }

            /**
             * @private
             */
            _currentTotal() {
                if (this.step !== 1) {
                    return null;
                }

                if (!this.price || !this.amount) {
                    this.totalPrice = this.priceBalance.cloneWithTokens('0');
                } else {
                    this.totalPrice = this.priceBalance.cloneWithTokens(
                        this.price.getTokens().mul(this.amount.getTokens())
                    );
                }

                if (this.type === 'buy') {
                    this.canBuyOrder = (
                        this.totalPrice.lte(this.priceBalance) && this.priceBalance.getTokens().gt(0)
                    );
                } else {
                    this.canBuyOrder = true;
                }
            }

            /**
             * @private
             */
            _getData() {
                return waves.matcher.getOrderBook(this._assetIdPair.amount, this._assetIdPair.price)
                    .then(({ bids, asks, spread }) => {
                        const [lastAsk] = asks;
                        const [firstBid] = bids;

                        return { lastAsk, firstBid, spread };
                    });
            }

            /**
             * @param lastAsk
             * @param firstBid
             * @param spread
             * @private
             */
            _setData({ lastAsk, firstBid }) {
                this.bid = firstBid || { price: 0 };
                this.ask = lastAsk || { price: 0 };

                const sell = Number(this.bid.price);
                const buy = Number(this.ask.price);

                this.spreadPercent = buy ? (((buy - sell) * 100 / buy) || 0).toFixed(2) : '0.00';
            }

            /**
             * @return {Money}
             * @private
             */
            _getMaxAmountBalance() {
                return CreateOrder._getMaxAmountBalance(this.type, this.amountBalance, this.fee);
            }

            /**
             * @param {string} type
             * @param {Money} amount
             * @param {Money} fee
             * @return {Money}
             * @private
             */
            static _getMaxAmountBalance(type, amount, fee) {
                if (!type || type === 'buy') {
                    return null;
                }
                if (amount.asset.id === fee.asset.id) {
                    const result = amount.sub(fee);
                    if (result.getTokens().gte('0')) {
                        return result;
                    } else {
                        return amount.cloneWithTokens('0');
                    }
                } else {
                    return amount;
                }
            }

        }

        return new CreateOrder();
    };

    controller.$inject = [
        'Base',
        'waves',
        'user',
        'utils',
        'createPoll',
        '$scope',
        '$element',
        'notification',
        'dexDataService'
    ];

    angular.module('app.dex').component('wCreateOrder', {
        bindings: {},
        templateUrl: 'modules/dex/directives/createOrder/createOrder.html',
        transclude: false,
        controller
    });
})();
