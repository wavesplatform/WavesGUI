(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @param {User} user
     * @param {app.utils} utils
     * @param {function} createPoll
     * @param $scope
     * @param {JQuery} $element
     * @param {NotificationManager} notificationManager
     * @param {DexDataService} dexDataService
     * @return {CreateOrder}
     */
    const controller = function (Base, waves, user, utils, createPoll, $scope,
                                 $element, notificationManager, dexDataService) {

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
                this.cantByOrder = false;
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
                 * @type {BigNumber}
                 */
                this.totalPrice = null;
                /**
                 * @type {{amount: string, price: string}}
                 * @private
                 */
                this._assetIdPair = null;

                Waves.Money.fromTokens('0.003', WavesApp.defaultAssets.WAVES).then((money) => {
                    this.fee = money;
                });

                this.receive(dexDataService.chooseOrderBook, ({ type, price, amount }) => {
                    this.amount = new BigNumber(amount);
                    this.price = new BigNumber(price);
                    this.expand(type);
                    $scope.$apply();
                });

                this.syncSettings({
                    _assetIdPair: 'dex.assetIdPair'
                });

                this.observe('_assetIdPair', () => {
                    this.amount = null;
                    this.price = null;
                    balancesPoll.restart();
                });

                /**
                 * @type {Poll}
                 */
                const balancesPoll = createPoll(this, this._getBalances, this._setBalances, 1000);

                this.observe(['amount', 'price', 'step', 'type'], this._currentTotal);

                // TODO Add directive for stop propagation (catch move for draggable)
                $element.on('mousedown', '.body', (e) => {
                    e.stopPropagation();
                });

                createPoll(this, this._getData, this._setData, 1000);
            }

            expand(type) {
                this.type = type;
                this.step = 1;
                this.maxAmountBalance = CreateOrder._getMaxAmountBalance(this.type, this.amountBalance, this.fee);
                switch (type) {
                    case 'sell':
                        this.price = new BigNumber(this.bid.price);
                        break;
                    case 'buy':
                        this.price = new BigNumber(this.ask.price);
                        break;
                    default:
                        throw new Error('Wrong type');
                }

                $scope.$$postDigest(() => {
                    $element.find('input[name="amount"]').focus();
                });
            }

            setMaxAmount() {
                if (this.amountBalance.asset.id === this.fee.asset.id) {
                    this.amount = this.amountBalance.sub(this.fee).getTokens()
                        .round(this.amountBalance.asset.precision, BigNumber.ROUND_FLOOR);
                } else {
                    this.amount = this.amountBalance.getTokens()
                        .round(this.amountBalance.asset.precision, BigNumber.ROUND_FLOOR);
                }
            }

            setMaxPrice() {
                if (this.priceBalance.asset.id === this.fee.asset.id) {
                    this.amount = this.priceBalance.sub(this.fee)
                        .getTokens()
                        .div(this.price)
                        .round(this.amountBalance.asset.precision, BigNumber.ROUND_FLOOR);
                } else {
                    this.amount = this.priceBalance.getTokens()
                        .div(this.price)
                        .round(this.amountBalance.asset.precision, BigNumber.ROUND_FLOOR);
                }
            }

            collapse() {
                this.type = null;
                this.step = 0;
            }

            createOrder(form) {
                user.getSeed()
                    .then((seed) => {
                        return Waves.AssetPair.get(this._assetIdPair.amount, this._assetIdPair.price).then((pair) => {
                            return Promise.all([
                                Waves.Money.fromTokens(this.amount.toFixed(), this.amountBalance.asset.id),
                                Waves.OrderPrice.fromTokens(this.price.toFixed(), pair)
                            ]);
                        }).then(([amount, price]) => {
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
                            notificationManager.success({
                                ns: 'app.dex',
                                title: { literal: 'directives.createOrder.notifications.isCreated' }
                            });
                        }).catch((err) => {
                            // TODO : refactor this
                            const notEnough = 'Not enough tradable balance';
                            const isNotEnough = (err.data.message.slice(0, notEnough.length) === notEnough);
                            notificationManager.error({
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

            _setBalances(data) {
                if (data) {
                    this.amountBalance = data.amountBalance;
                    this.priceBalance = data.priceBalance;
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
                    this.totalPrice = new BigNumber(0);
                } else {
                    this.totalPrice = this.price.mul(this.amount);
                }

                if (this.type === 'buy') {
                    this.cantByOrder = this.priceBalance.getTokens().lte(this.totalPrice);
                } else {
                    this.cantByOrder = false;
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
            _setData({ lastAsk, firstBid, spread }) {
                this.bid = firstBid || { price: 0 };
                this.ask = lastAsk || { price: 0 };
                this.spread = spread;

                const sell = Number(this.bid.price);
                const buy = Number(this.ask.price);

                this.spreadPercent = ((buy - sell) * 100 / buy).toFixed(2);
            }

            /**
             * @param {string} type
             * @param {Money} amount
             * @param {Money} fee
             * @return {Money}
             * @private
             */
            static _getMaxAmountBalance(type, amount, fee) {
                if (type === 'buy') {
                    return null;
                }
                if (amount.asset.id === fee.asset.id) {
                    return amount.sub(fee);
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
        'notificationManager',
        'dexDataService'
    ];

    angular.module('app.dex').component('wCreateOrder', {
        bindings: {},
        templateUrl: 'modules/dex/directives/createOrder/createOrder.html',
        transclude: false,
        controller
    });
})();
