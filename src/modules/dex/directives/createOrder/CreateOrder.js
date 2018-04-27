(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @param {User} user
     * @param {app.utils} utils
     * @param {IPollCreate} createPoll
     * @param {$rootScope.Scope} $scope
     * @param {JQuery} $element
     * @param {INotification} notification
     * @param {DexDataService} dexDataService
     * @param {Ease} ease
     * @return {CreateOrder}
     */
    const controller = function (Base, waves, user, utils, createPoll, $scope,
                                 $element, notification, dexDataService, ease) {

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
                 * @type {form.FormController}
                 */
                this.order = null;
                /**
                 * @type {Money}
                 */
                this.amount = null;
                /**
                 * @type {Money}
                 */
                this.price = null;
                /**
                 * @type {{amount: string, price: string}}
                 * @private
                 */
                this._assetIdPair = null;

                Waves.Money.fromTokens('0.003', WavesApp.defaultAssets.WAVES).then((money) => {
                    this.fee = money;
                    $scope.$digest();
                });

                this.receive(dexDataService.chooseOrderBook, ({ type, price, amount }) => {
                    this.expand(type);
                    this.amount = this.amountBalance.cloneWithTokens(amount);
                    this.price = this.priceBalance.cloneWithTokens(price);
                    $scope.$digest();
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

                this.observe(['amountBalance', 'type', 'fee'], this._updateMaxAmountBalance);

                this.observe('_assetIdPair', () => {
                    this.amount = null;
                    this.price = null;
                    this.bid = null;
                    this.ask = null;
                    balancesPoll.restart();
                    spreadPoll.restart();
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
                if (this.price.getTokens().eq(0)) {
                    this.amount = this.amountBalance.cloneWithTokens('0');
                    return null;
                }
                if (this.priceBalance.asset.id === this.fee.asset.id) {
                    const amount = this.amountBalance.cloneWithTokens(this.priceBalance.sub(this.fee)
                        .getTokens()
                        .div(this.price.getTokens())
                        .round(this.amountBalance.asset.precision, BigNumber.ROUND_FLOOR));
                    if (amount.getTokens().lt(0)) {
                        this.amount = amount.cloneWithTokens('0');
                    } else {
                        this.amount = amount;
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
                const notify = $element.find('.js-order-notification');
                notify.removeClass('success').removeClass('error');

                return user.getSeed()
                    .then((seed) => {
                        return Waves.AssetPair.get(this._assetIdPair.amount, this._assetIdPair.price).then((pair) => {
                            return Waves.OrderPrice.fromTokens(this.price.getTokens(), pair);
                        }).then((price) => {
                            const amount = this.amount;
                            this.amount = null;
                            form.$setPristine();
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
                            notify.addClass('success');
                            this.createOrderFailed = false;
                            const pair = `${this.amountBalance.asset.id}/${this.priceBalance.asset.id}`;
                            analytics.push('DEX', `DEX.Order.${this.type}.Success`, pair);
                            notification.success({
                                ns: 'app.dex',
                                title: { literal: 'directives.createOrder.notifications.isCreated' }
                            });
                            $element.find('input[name="amount"]').focus();
                        }).catch((err) => {
                            this.createOrderFailed = true;
                            notify.addClass('error');
                            const pair = `${this.amountBalance.asset.id}/${this.priceBalance.asset.id}`;
                            analytics.push('DEX', `DEX.Order.${this.type}.Error`, pair);
                            // TODO : refactor this
                            const notEnough = 'Not enough tradable balance';
                            const isNotEnough = (err.data && err.data.message.slice(0, notEnough.length) === notEnough);
                            notification.error({
                                ns: 'app.dex',
                                title: {
                                    literal: isNotEnough ?
                                        'directives.createOrder.notifications.notEnoughBalance' :
                                        'directives.createOrder.notifications.somethingWendWrong'
                                }
                            });
                        }).then(() => {
                            $scope.$apply();
                            CreateOrder._animateNotification(notify);
                        });
                    });
            }

            /**
             * @private
             */
            _updateMaxAmountBalance() {
                const { type, amountBalance, fee } = this;

                if (!type || type === 'buy' || !amountBalance || !fee) {
                    this.maxAmountBalance = null;
                    return null;
                }

                const apply = function () {
                    if (amountBalance.asset.id === fee.asset.id) {
                        const result = amountBalance.sub(fee);
                        if (result.getTokens().gte('0')) {
                            return result;
                        } else {
                            return amountBalance.cloneWithTokens('0');
                        }
                    } else {
                        return amountBalance;
                    }
                };

                this.maxAmountBalance = apply();
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
                    $scope.$digest();
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
                $scope.$digest();
            }

            static _animateNotification($element) {
                return utils.animate($element, { t: 100 }, {
                    duration: 1200,
                    step: function (tween) {
                        const progress = ease.bounceOut(tween / 100);
                        $element.css('transform', `translate(0, ${-100 + progress * 100}%)`);
                    }
                })
                    .then(() => utils.wait(700))
                    .then(() => {
                        return utils.animate($element, { t: 0 }, {
                            duration: 500,
                            step: function (tween) {
                                const progress = ease.linear(tween / 100);
                                $element.css('transform', `translate(0, ${(-((1 - progress) * 100))}%)`);
                            }
                        });
                    });
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
        'dexDataService',
        'ease'
    ];

    angular.module('app.dex').component('wCreateOrder', {
        bindings: {},
        templateUrl: 'modules/dex/directives/createOrder/createOrder.html',
        transclude: false,
        controller
    });
})();
