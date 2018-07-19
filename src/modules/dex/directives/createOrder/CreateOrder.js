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
     * @param {$state} $state
     * @param {ModalManager} modalManager
     * @return {CreateOrder}
     */
    const controller = function (Base, waves, user, utils, createPoll, $scope,
                                 $element, notification, dexDataService, ease, $state, modalManager) {

        const entities = require('@waves/data-entities');
        const ds = require('data-service');

        class CreateOrder extends Base {


            /**
             * @return {string}
             */
            get priceDisplayName() {
                return this.priceBalance && this.priceBalance.asset.displayName || '';
            }

            /**
             * @return {string}
             */
            get amountDisplayName() {
                return this.amountBalance && this.amountBalance.asset.displayName || '';
            }

            get loaded() {
                return this.amountBalance && this.priceBalance;
            }

            constructor() {
                super();
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
                this.type = 'buy';
                /**
                 * Max balance in price asset
                 * @type {Money}
                 */
                this.maxPriceBalance = null;
                /**
                 * Total price (amount multiply price)
                 * @type {Money}
                 */
                this.totalPrice = null;
                /**
                 * @type {Money}
                 */
                this.amount = null;
                /**
                 * @type {Money}
                 */
                this.price = null;
                /**
                 * @type {boolean}
                 */
                this.idDemo = !user.address;
                /**
                 * @type {number}
                 */
                this.ERROR_DISPLAY_INTERVAL = 3;
                /**
                 * @type {{amount: string, price: string}}
                 * @private
                 */
                this._assetIdPair = null;
                /**
                 * @type {Money}
                 * @private
                 */
                this.lastTradePrice = null;
                /**
                 * @type {string}
                 */
                this.focusedInputName = null;
                /**
                 * @type {[]}
                 */
                this.expirationValues = [
                    { name: '5min', value: () => utils.moment().add().minute(5).getDate().getTime() },
                    { name: '30min', value: () => utils.moment().add().minute(30).getDate().getTime() },
                    { name: '1hour', value: () => utils.moment().add().hour(1).getDate().getTime() },
                    { name: '1day', value: () => utils.moment().add().day(1).getDate().getTime() },
                    { name: '1week', value: () => utils.moment().add().week(1).getDate().getTime() },
                    {
                        name: '30day',
                        value: () => utils.moment()
                            .add().day(29)
                            .add().hour(23)
                            .add().minute(55).getDate().getTime()
                    }
                ];

                this.expiration = this.expirationValues[this.expirationValues.length - 1].value;

                ds.moneyFromTokens('0.003', WavesApp.defaultAssets.WAVES).then((money) => {
                    this.fee = money;
                    $scope.$digest();
                });

                this.receive(dexDataService.chooseOrderBook, ({ type, price, amount }) => {
                    this.expand(type);
                    switch (type) {
                        case 'buy':
                            this._onClickBuyOrder(price, amount);
                            break;
                        case 'sell':
                            this._onClickSellOrder(price, amount);
                            break;
                        default:
                            throw new Error('Wrong order type!');
                    }
                    $scope.$digest();
                });

                this.syncSettings({
                    _assetIdPair: 'dex.assetIdPair'
                });

                /**
                 * @type {Poll}
                 */
                let lastTraderPoll;
                /**
                 * @type {Poll}
                 */
                const balancesPoll = createPoll(this, this._getBalances, this._setBalances, 1000);
                /**
                 * @type {Poll}
                 */
                const spreadPoll = createPoll(this, this._getData, this._setData, 1000);

                const lastTradePromise = new Promise((resolve) => {
                    balancesPoll.ready.then(() => {
                        lastTraderPoll = createPoll(this, this._getLastPrice, 'lastTradePrice', 1000);
                        resolve();
                    });
                });

                Promise.all([
                    balancesPoll.ready,
                    lastTradePromise,
                    spreadPoll.ready
                ]).then(() => {
                    this.amount = this.amountBalance.cloneWithTokens('0');
                    if (this.lastTradePrice && this.lastTradePrice.getTokens().gt(0)) {
                        this.price = this.lastTradePrice;
                    } else {
                        this.price = this._getCurrentPrice();
                    }
                });

                this.observe(['amountBalance', 'type', 'fee', 'priceBalance'], this._updateMaxAmountOrPriceBalance);

                this.observe('_assetIdPair', () => {
                    this.amount = null;
                    this.price = null;
                    this.bid = null;
                    this.ask = null;
                    balancesPoll.restart();
                    spreadPoll.restart();
                    const form = this.order;
                    form.$setUntouched();
                    form.$setPristine();
                    if (lastTraderPoll) {
                        lastTraderPoll.restart();
                    }
                    this.observeOnce(['bid', 'ask'], utils.debounce(() => {
                        if (this.type) {
                            this.amount = this.amountBalance.cloneWithTokens('0');
                            this.price = this._getCurrentPrice();
                            $scope.$apply();
                        }
                    }));
                });

                this.observe(['priceBalance', 'totalPrice'], this._setIfCanBuyOrder);

                this.observe(['amount', 'price', 'type'], this._currentTotal);
                this.observe('totalPrice', this._currentAmount);

                // TODO Add directive for stop propagation (catch move for draggable)
                $element.on('mousedown touchstart', '.body', (e) => {
                    e.stopPropagation();
                });
            }

            expand(type) {
                this.type = type;
                if (!this.price || this.price.getTokens().eq('0')) {
                    this.price = this._getCurrentPrice();
                }

                // todo: refactor after getting rid of Layout-DEX coupling.
                $element.parent().parent().parent().parent().parent().addClass('expanded');
            }

            closeCreateOrder() {
                // todo: refactor after getting rid of Layout-DEX coupling.
                $element.parent().parent().parent().parent().parent().removeClass('expanded');
            }

            /**
             * @returns {boolean}
             */
            isAmountInvalid() {
                return this.isDirtyAndInvalid(this.order.amount);
            }

            /**
             * @returns {boolean}
             */
            isPriceInvalid() {
                return this.isDirtyAndInvalid(this.order.price);
            }

            /**
             * @returns {boolean}
             */
            isTotalInvalid() {
                return this.isDirtyAndInvalid(this.order.total);
            }

            /**
             * @param field
             * @returns {boolean}
             */
            isDirtyAndInvalid(field) {
                return field.$touched && field.$invalid;
            }

            setMaxAmount() {
                this._setDirtyAmount(this._getMaxAmountForSell());
            }

            setMaxPrice() {
                this._setDirtyAmount(this._getMaxAmountForBuy());
            }

            setBidPrice() {
                this._setDirtyPrice(this.priceBalance.cloneWithTokens(String(this.bid.price)));
            }

            setAskPrice() {
                this._setDirtyPrice(this.priceBalance.cloneWithTokens(String(this.ask.price)));
            }

            setLastPrice() {
                this._setDirtyPrice(this.lastTradePrice);
            }

            /**
             * @return {*}
             */
            createOrder($event) {
                if (this.idDemo) {
                    return this._showDemoModal();
                }

                const form = this.order;
                $event.preventDefault();
                const notify = $element.find('.js-order-notification');
                notify.removeClass('success').removeClass('error');

                return ds.orderPriceFromTokens(
                    this.price.getTokens(),
                    this._assetIdPair.amount,
                    this._assetIdPair.price
                )
                    .then((price) => {
                        const amount = this.amount;
                        form.$setUntouched();
                        $scope.$apply();
                        return ds.createOrder({
                            amountAsset: this.amountBalance.asset.id,
                            priceAsset: this.priceBalance.asset.id,
                            orderType: this.type,
                            price: price.toMatcherCoins(),
                            amount: amount.toCoins(),
                            matcherFee: this.fee.getCoins(),
                            expiration: this.expiration()
                        });
                    }).then(() => {
                        notify.addClass('success');
                        this.createOrderFailed = false;
                        const pair = `${this.amountBalance.asset.id}/${this.priceBalance.asset.id}`;
                        analytics.push('DEX', `DEX.${WavesApp.type}.Order.${this.type}.Success`, pair);
                        dexDataService.createOrder.dispatch();
                    }).catch(() => {
                        this.createOrderFailed = true;
                        notify.addClass('error');
                        const pair = `${this.amountBalance.asset.id}/${this.priceBalance.asset.id}`;
                        analytics.push('DEX', `DEX.${WavesApp.type}.Order.${this.type}.Error`, pair);
                    }).finally(() => {
                        CreateOrder._animateNotification(notify);
                    });
            }

            _showDemoModal() {
                return modalManager.showDialogModal({
                    iconClass: 'open-main-dex-account-info',
                    message: { literal: 'modal.createOrder.message' },
                    buttons: [
                        {
                            success: false,
                            classes: 'big',
                            text: { literal: 'modal.createOrder.cancel' },
                            click: () => $state.go('create')
                        },
                        {
                            success: true,
                            classes: 'big submit',
                            text: { literal: 'modal.createOrder.ok' },
                            click: () => $state.go('welcome')
                        }
                    ]
                })
                    .catch(() => null)
                    .then(() => {
                        const form = this.order;
                        this.amount = null;
                        form.$setUntouched();
                        form.$setPristine();
                    });
            }

            /**
             * @param {string} price
             * @param {string} amount
             * @private
             */
            _onClickBuyOrder(price, amount) {
                const minAmount = this.amountBalance.cloneWithTokens(this.priceBalance.getTokens().div(price));
                this._setDirtyAmount(entities.Money.min(this.amountBalance.cloneWithTokens(amount), minAmount));
                this._setDirtyPrice(this.priceBalance.cloneWithTokens(price));
            }

            /**
             * @param {string} price
             * @param {string} amount
             * @private
             */
            _onClickSellOrder(price, amount) {
                const amountMoney = this.amountBalance.cloneWithTokens(amount);
                this._setDirtyAmount(entities.Money.min(amountMoney, this._getMaxAmountForSell()));
                this._setDirtyPrice(this.priceBalance.cloneWithTokens(price));
            }

            /**
             * @return {Money}
             * @private
             */
            _getMaxAmountForSell() {
                const fee = this.fee;
                const balance = this.amountBalance;
                return balance.safeSub(fee).toNonNegative();
            }

            /**
             * @return {Money}
             * @private
             */
            _getMaxAmountForBuy() {
                if (!this.price || this.price.getTokens().eq(0)) {
                    return this.amountBalance.cloneWithTokens('0');
                }

                const fee = this.fee;

                return this.amountBalance.cloneWithTokens(
                    this.priceBalance.safeSub(fee)
                        .toNonNegative()
                        .getTokens()
                        .div(this.price.getTokens())
                        .dp(this.amountBalance.asset.precision)
                );
            }

            /**
             * @return {Promise<Money>}
             * @private
             */
            _getLastPrice() {
                return ds.api.transactions.getExchangeTxList({
                    amountAsset: this._assetIdPair.amount,
                    priceAsset: this._assetIdPair.price,
                    limit: 1
                }).then(([tx]) => tx && tx.price || null);
            }

            /**
             * @private
             */
            _updateMaxAmountOrPriceBalance() {
                if (!this.amountBalance || !this.fee || !this.priceBalance) {
                    return null;
                }

                if (this.type === 'sell') {
                    this.maxAmountBalance = this._getMaxAmountForSell();
                    this.maxPriceBalance = null;
                } else {
                    this.maxAmountBalance = null;
                    this.maxPriceBalance = this.priceBalance.safeSub(this.fee).toNonNegative();
                }
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
                if (!this.idDemo) {
                    return ds.api.pairs.get(this._assetIdPair.amount, this._assetIdPair.price).then((pair) => {
                        return utils.whenAll([
                            waves.node.assets.balance(pair.amountAsset.id),
                            waves.node.assets.balance(pair.priceAsset.id)
                        ]).then(([amountMoney, priceMoney]) => ({
                            amountBalance: amountMoney.available,
                            priceBalance: priceMoney.available
                        }));
                    });
                } else {
                    return ds.api.pairs.get(this._assetIdPair.amount, this._assetIdPair.price).then((pair) => {
                        return {
                            amountBalance: entities.Money.fromTokens(10, pair.amountAsset),
                            priceBalance: entities.Money.fromTokens(10, pair.priceAsset)
                        };
                    });
                }
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
                if (this.focusedInputName === 'total') {
                    return null;
                }

                if (!this.price || !this.amount) {
                    this.totalPrice = this.priceBalance.cloneWithTokens('0');
                } else {
                    this.totalPrice = this.priceBalance.cloneWithTokens(
                        this.price.getTokens().times(this.amount.getTokens())
                    );
                }
                this._setIfCanBuyOrder();
            }

            /**
             * @returns {null}
             * @private
             */
            _currentAmount() {
                if (this.focusedInputName !== 'total') {
                    return null;
                }

                if (!this.totalPrice || !this.price || this.price.getTokens().eq('0')) {
                    return null;
                }

                const amount = this.totalPrice.getTokens().div(this.price.getTokens());
                this._setDirtyAmount(this.amountBalance.cloneWithTokens(amount));

                this._setIfCanBuyOrder();
            }

            /**
             * @private
             */
            _setIfCanBuyOrder() {
                if (this.type === 'buy' &&
                    this.totalPrice &&
                    this.priceBalance &&
                    this.totalPrice.asset.id === this.priceBalance.asset.id) {

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

            /**
             * Set only non-zero amount values
             * @param {Money} amount
             * @private
             */
            _setDirtyAmount(amount) {
                this.amount = amount;
                this.order.$setDirty();
            }

            /**
             * @param {Money} price
             * @private
             */
            _setDirtyPrice(price) {
                this.price = price;
                this.order.$setDirty();
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
        'ease',
        '$state',
        'modalManager'
    ];

    angular.module('app.dex').component('wCreateOrder', {
        bindings: {},
        templateUrl: 'modules/dex/directives/createOrder/createOrder.html',
        transclude: false,
        controller
    });
})();
