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
     * @param {BalanceWatcher} balanceWatcher
     * @return {CreateOrder}
     */
    const controller = function (Base, waves, user, utils, createPoll, $scope,
                                 $element, notification, dexDataService, ease, $state, modalManager, balanceWatcher) {

        const { Money } = require('@waves/data-entities');
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
                 *
                 * @type {boolean}
                 */
                this.expirationValues = [
                    { name: '5min', value: () => utils.moment().add().minute(5).getDate().getTime() },
                    { name: '30min', value: () => utils.moment().add().minute(30).getDate().getTime() },
                    { name: '1hour', value: () => utils.moment().add().hour(1).getDate().getTime() },
                    { name: '1day', value: () => utils.moment().add().day(1).getDate().getTime() },
                    { name: '1week', value: () => utils.moment().add().week(1).getDate().getTime() },
                    { name: '30day', value: () => utils.moment().add().day(29).getDate().getTime() }
                ];

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
                    _assetIdPair: 'dex.assetIdPair',
                    expiration: 'dex.createOrder.expirationName'
                });

                /**
                 * @type {Poll}
                 */
                let lastTraderPoll;
                /**
                 * @type {Poll}
                 */
                const spreadPoll = createPoll(this, this._getData, this._setData, 1000);

                this.receive(balanceWatcher.change, this._updateBalances, this);
                this._updateBalances();

                const lastTradePromise = new Promise((resolve) => {
                    balanceWatcher.ready.then(() => {
                        lastTraderPoll = createPoll(this, this._getLastPrice, 'lastTradePrice', 1000);
                        resolve();
                    });
                });

                const currentFee = () => Promise.all([
                    ds.api.pairs.get(this._assetIdPair.amount, this._assetIdPair.price),
                    ds.fetch(ds.config.get('matcher'))
                ]).then(([pair, matcherPublicKey]) => waves.matcher.getCreateOrderFee({
                    amount: new Money(0, pair.amountAsset),
                    price: new Money(0, pair.priceAsset),
                    matcherPublicKey
                })).then(fee => {
                    this.fee = fee;
                    $scope.$apply();
                });

                Promise.all([
                    ds.api.pairs.get(this._assetIdPair.amount, this._assetIdPair.price),
                    lastTradePromise,
                    spreadPoll.ready
                ]).then(([pair]) => {
                    this.amount = new Money(0, pair.amountAsset);
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
                    this._updateBalances();
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
                    currentFee();
                });

                this.observe(['priceBalance', 'totalPrice', 'maxPriceBalance'], this._setIfCanBuyOrder);

                this.observe(['amount', 'price', 'type'], this._currentTotal);
                this.observe('totalPrice', this._currentAmount);

                // TODO Add directive for stop propagation (catch move for draggable)
                $element.on('mousedown touchstart', '.body', (e) => {
                    e.stopPropagation();
                });

                currentFee();
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

                return ds.fetch(ds.config.get('matcher'))
                    .then((matcherPublicKey) => {
                        form.$setUntouched();
                        $scope.$apply();

                        const data = {
                            orderType: this.type,
                            price: this.price,
                            amount: this.amount,
                            matcherFee: this.fee,
                            matcherPublicKey
                        };

                        this._checkOrder(data)
                            .then(() => this._sendOrder(data))
                            .then(data => {

                                if (!data) {
                                    return null;
                                }

                                notify.addClass('success');
                                this.createOrderFailed = false;
                                const pair = `${this.amountBalance.asset.id}/${this.priceBalance.asset.id}`;
                                analytics.push('DEX', `DEX.${WavesApp.type}.Order.${this.type}.Success`, pair);
                                dexDataService.createOrder.dispatch();
                                $scope.$apply();
                                CreateOrder._animateNotification(notify);
                            })
                            .catch(() => {
                                this.createOrderFailed = true;
                                notify.addClass('error');
                                const pair = `${this.amountBalance.asset.id}/${this.priceBalance.asset.id}`;
                                analytics.push('DEX', `DEX.${WavesApp.type}.Order.${this.type}.Error`, pair);
                                $scope.$apply();
                                CreateOrder._animateNotification(notify);
                            });
                    });
            }

            /**
             * @param data
             * @return {*|Promise}
             * @private
             */
            _sendOrder(data) {
                const expiration = ds.utils.normalizeTime(
                    this.expirationValues.find(el => el.name === this.expiration).value()
                );
                const clone = { ...data, expiration };

                return utils.createOrder(clone);
            }

            /**
             * @param orderData
             * @private
             */
            _checkOrder(orderData) {
                const isBuy = orderData.orderType === 'buy';
                const factor = isBuy ? 1 : -1;
                const limit = 1 + factor * (Number(user.getSetting('orderLimit')) || 0);
                const price = (new BigNumber(isBuy ? this.ask.price : this.bid.price)).times(limit);
                const orderPrice = orderData.price.getTokens();

                if (price.isNaN() || price.eq(0)) {
                    return Promise.resolve();
                }

                /**
                 * @type {BigNumber}
                 */
                const delta = isBuy ? orderPrice.minus(price) : price.minus(orderPrice);

                if (delta.isNegative()) {
                    return Promise.resolve();
                }

                return modalManager.showConfirmOrder({
                    ...orderData,
                    orderLimit: Number(user.getSetting('orderLimit')) * 100
                }).catch(() => {
                    throw new Error('You have cancelled the creation of this order');
                });
            }

            /**
             * @return {Promise<T | never>}
             * @private
             */
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
             * param {string} assetId1
             * param {string} assetId2
             * @private
             */
            _dexScriptedPair() {
                return modalManager.showDexScriptedPair();
            }

            /**
             * @param {string} price
             * @param {string} amount
             * @private
             */
            _onClickBuyOrder(price, amount) {
                const minAmount = this.amountBalance.cloneWithTokens(this.priceBalance.getTokens().div(price));
                this._setDirtyAmount(Money.min(this.amountBalance.cloneWithTokens(amount), minAmount));
                this._setDirtyPrice(this.priceBalance.cloneWithTokens(price));
            }

            /**
             * @param {string} price
             * @param {string} amount
             * @private
             */
            _onClickSellOrder(price, amount) {
                const amountMoney = this.amountBalance.cloneWithTokens(amount);
                this._setDirtyAmount(Money.min(amountMoney, this._getMaxAmountForSell()));
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
            _updateBalances() {
                if (!this.idDemo) {
                    return ds.api.pairs.get(this._assetIdPair.amount, this._assetIdPair.price).then(pair => {
                        this.amountBalance = balanceWatcher.getBalanceByAsset(pair.amountAsset);
                        this.priceBalance = balanceWatcher.getBalanceByAsset(pair.priceAsset);
                        utils.safeApply($scope);
                    });
                } else {
                    return ds.api.pairs.get(this._assetIdPair.amount, this._assetIdPair.price).then(pair => {
                        this.amountBalance = Money.fromTokens(10, pair.amountAsset);
                        this.priceBalance = Money.fromTokens(10, pair.priceAsset);
                        utils.safeApply($scope);
                    });
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

                    if (this.maxPriceBalance) {
                        this.canBuyOrder = (
                            this.totalPrice.lte(this.maxPriceBalance) && this.maxPriceBalance.getTokens().gt(0)
                        );
                    }
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
        'modalManager',
        'balanceWatcher'
    ];

    angular.module('app.dex').component('wCreateOrder', {
        bindings: {},
        templateUrl: 'modules/dex/directives/createOrder/createOrder.html',
        transclude: false,
        controller
    });
})();
