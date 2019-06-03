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

        const { without, keys, last, equals } = require('ramda');
        const { Money } = require('@waves/data-entities');
        const ds = require('data-service');
        const analytics = require('@waves/event-sender');

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

            get loadedPairRestrictions() {
                return !equals(this.pairRestrictions, Object.create(null));
            }

            /**
             * Max amount (with fee)
             * @type {Money}
             */
            maxAmountBalance = null;
            /**
             * Has price balance for buy amount
             * @type {boolean}
             */
            canBuyOrder = true;
            /**
             * Amount asset balance
             * @type {Money}
             */
            amountBalance = null;
            /**
             * Price asset balance
             * @type {Money}
             */
            priceBalance = null;
            /**
             * Order type
             * @type {string}
             */
            type = 'buy';
            /**
             * Max balance in price asset
             * @type {Money}
             */
            maxPriceBalance = null;
            /**
             * Total price (amount multiply price)
             * @type {Money}
             */
            total = null;
            /**
             * @type {Money}
             */
            amount = null;
            /**
             * @type {Money}
             */
            price = null;
            /**
             * @type {boolean}
             */
            loadingError = false;
            /**
             * @type {boolean}
             */
            idDemo = !user.address;
            /**
             * @type {number}
             */
            ERROR_DISPLAY_INTERVAL = 3;
            /**
             * @type {number}
             */
            ERROR_CLICKABLE_DISPLAY_INTERVAL = 6;
            /**
             * @type {{amount: string, price: string}}
             * @private
             */
            _assetIdPair = null;
            /**
             * @type string
             * @private
             */
            analyticsPair = null;
            /**
             * @type {Money}
             * @private
             */
            lastTradePrice = null;
            /**
             * @type {Array}
             */
            changedInputName = [];
            /**
             * @type {boolean}
             */
            _silenceNow = false;
            /**
             *
             * @type {boolean}
             */
            expirationValues = [
                { name: '5min', value: () => utils.moment().add().minute(5).getDate().getTime() },
                { name: '30min', value: () => utils.moment().add().minute(30).getDate().getTime() },
                { name: '1hour', value: () => utils.moment().add().hour(1).getDate().getTime() },
                { name: '1day', value: () => utils.moment().add().day(1).getDate().getTime() },
                { name: '1week', value: () => utils.moment().add().week(1).getDate().getTime() },
                { name: '30day', value: () => utils.moment().add().day(29).getDate().getTime() }
            ];
            /**
             * @type {Money}
             */
            maxAmount = null;
            /**
             * @type {boolean}
             */
            isValidStepSize = false;
            /**
             * @type {boolean}
             */
            isValidTickSize = false;
            /**
             * @type {Object}
             */
            pairRestrictions = {};
            /**
             * @type {Money}
             */
            _price = null;
            /**
             * @type {Money}
             */
            _amount = null;


            constructor() {
                super();

                this.observe(['type', 'amount', 'price', 'amountBalance', 'fee'], this._currentMaxAmount);

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

                this.analyticsPair = `${this._assetIdPair.amount} / ${this._assetIdPair.price}`;

                /**
                 * @type {Poll}
                 */
                let lastTraderPoll;
                /**
                 * @type {Poll}
                 */
                const spreadPoll = createPoll(this, this._getData, this._setData, 1000);

                this.receive(balanceWatcher.change, () => {
                    this._updateBalances();
                }, this);
                this._updateBalances()
                    .then(() => this._setPairRestrictions());

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

                this.isValidStepSize = this._validateStepSize();
                this.isValidTickSize = this._validateTickSize();

                this.observe(['amountBalance', 'type', 'fee', 'priceBalance'], this._updateMaxAmountOrPriceBalance);
                this.observe(['maxAmountBalance', 'amountBalance', 'priceBalance'], this._setPairRestrictions);

                this.observe('_assetIdPair', () => {
                    this.amount = null;
                    this.price = null;
                    this.total = null;
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
                    this.analyticsPair = `${this._assetIdPair.amount} / ${this._assetIdPair.price}`;
                    this.observeOnce(['bid', 'ask'], utils.debounce(() => {
                        if (this.type) {
                            this.amount = this.amountBalance.cloneWithTokens('0');
                            this.price = this._getCurrentPrice();
                            this.total = this.priceBalance.cloneWithTokens('0');
                            $scope.$apply();
                        }
                    }));
                    currentFee();
                });

                this.observe(['priceBalance', 'total', 'maxPriceBalance'], this._setIfCanBuyOrder);

                this.observe('amount', () => {
                    this.isValidStepSize = this._validateStepSize();
                    if (!this._silenceNow) {
                        this._updateField({ amount: this.amount });
                    }
                    if (this.amount) {
                        this._amount = this.amount;
                    }
                });

                this.observe('price', () => {
                    this.isValidTickSize = this._validateTickSize();
                    if (!this._silenceNow) {
                        this._updateField({ price: this.price });
                    }
                    if (this.price) {
                        this._price = this.price;
                    }
                });

                this.observe('total', () => (
                    !this._silenceNow && this._updateField({ total: this.total })
                ));

                // TODO Add directive for stop propagation (catch move for draggable)
                $element.on('mousedown touchstart', '.body', (e) => {
                    e.stopPropagation();
                });

                currentFee();
            }

            /**
             * @param {number} factor
             * @return {boolean}
             */
            isActiveBalanceButton(factor) {
                const amount = this.amount;

                if (!amount || amount.getTokens().eq(0)) {
                    return false;
                }

                return this.maxAmount.cloneWithTokens(this.maxAmount.getTokens().times(factor)).eq(amount);
            }

            /**
             * @param {number} factor
             * @return {Promise}
             */
            setAmountByBalance(factor) {
                const amount = this.maxAmount.cloneWithTokens(
                    this.roundAmount(this.maxAmount.getTokens().times(factor))
                );
                this._updateField({ amount });
                return Promise.resolve();
            }

            /**
             * @return {boolean}
             */
            hasBalance() {
                return !this.maxAmount.getTokens().isZero();
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
                const amount = this.maxAmount;
                this._updateField({ amount });
            }

            setMaxPrice() {
                const amount = this.maxAmount;
                const total = this.priceBalance.cloneWithTokens(
                    this.price.getTokens().times(amount.getTokens())
                );
                const price = this.price;
                this._updateField({ amount, total, price });
            }

            setPrice(value) {
                const price = this.priceBalance.cloneWithTokens(value);
                this._updateField({ price });
            }

            setAmount(value) {
                const amount = this.amountBalance.cloneWithTokens(value);
                this._updateField({ amount });
            }

            setBidPrice() {
                const price = this.priceBalance.cloneWithTokens(String(this.bid.price));
                this._updateField({ price });
            }

            setAskPrice() {
                const price = this.priceBalance.cloneWithTokens(String(this.ask.price));
                this._updateField({ price });
            }

            setLastPrice() {
                const price = this.lastTradePrice;
                this._updateField({ price });
            }

            /**
             * @public
             * @param field {string}
             */
            setChangedInput(field) {
                if (last(this.changedInputName) === field) {
                    return null;
                }
                if (this.changedInputName.length === 2) {
                    this.changedInputName.shift();
                }
                this.changedInputName.push(field);
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

                        this._checkScriptAssets()
                            .then(() => this._checkOrder(data))
                            .then(() => this._sendOrder(data))
                            .then(data => {
                                if (!data) {
                                    return null;
                                }

                                notify.addClass('success');
                                this.createOrderFailed = false;
                                analytics.send({
                                    name: `DEX ${this.type} Order Transaction Success`,
                                    params: this.analyticsPair
                                });
                                dexDataService.createOrder.dispatch();
                                CreateOrder._animateNotification(notify);
                            })
                            .catch(() => {
                                this.createOrderFailed = true;
                                notify.addClass('error');
                                analytics.send({
                                    name: `DEX ${this.type} Order Transaction Error`,
                                    params: this.analyticsPair
                                });
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
             * @return {Promise}
             * @private
             */
            _checkScriptAssets() {
                if (user.getSetting('tradeWithScriptAssets')) {
                    return Promise.resolve();
                }

                const scriptAssets = [
                    this.amountBalance.asset,
                    this.priceBalance.asset
                ].filter(asset => asset.hasScript);

                if (scriptAssets.length > 0) {
                    return modalManager.showDexScriptedPair(scriptAssets);
                } else {
                    return Promise.resolve();
                }
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
             * @param {string} priceStr
             * @param {string} amountStr
             * @private
             */
            _onClickBuyOrder(priceStr, amountStr) {
                this.changedInputName = ['price'];
                const price = this.priceBalance.cloneWithTokens(priceStr);
                const maxAmount = this.amountBalance.cloneWithTokens(this.priceBalance.getTokens().div(priceStr));
                const amount = Money.min(this.amountBalance.cloneWithTokens(amountStr), maxAmount);
                this._updateField({ amount, price });
            }

            /**
             * @param {string} priceStr
             * @param {string} amountStr
             * @private
             */
            _onClickSellOrder(priceStr, amountStr) {
                this.changedInputName = ['price'];
                const price = this.priceBalance.cloneWithTokens(priceStr);
                const amountMoney = this.amountBalance.cloneWithTokens(amountStr);
                const amount = Money.min(amountMoney, this.maxAmount);
                this._updateField({ amount, price });
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
                const fee = this.fee;

                if (!fee || !this.price || this.price.getTokens().eq(0)) {
                    return this.amountBalance.cloneWithTokens('0');
                }

                return this.amountBalance.cloneWithTokens(
                    this.priceBalance.safeSub(fee)
                        .toNonNegative()
                        .getTokens()
                        .div(this.price.getTokens())
                        .dp(this.amountBalance.asset.precision)
                );
            }

            _currentMaxAmount() {
                if (this.type === 'buy') {
                    this.maxAmount = this._getMaxAmountForBuy();
                } else {
                    this.maxAmount = this._getMaxAmountForSell();
                }
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
                }).then(([tx]) => tx && tx.price || null).catch(() => (this.loadingError = false));
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
             * @param {object} newState
             * @private
             */
            _updateField(newState) {
                this._setSilence(() => {
                    this._applyState(newState);

                    const inputKeys = ['price', 'total', 'amount'];
                    const changingValues = without(keys(newState), inputKeys);

                    let changingValue;
                    if (changingValues.length === 1) {
                        changingValue = changingValues[0];
                    } else {
                        if (this.changedInputName.length === 0) {
                            this.changedInputName.push('price');
                        }

                        if (changingValues.some(el => el === last(this.changedInputName))) {
                            changingValue = changingValues.find(el => el !== last(this.changedInputName));
                        } else {
                            changingValue = without(this.changedInputName, changingValues)[0];
                        }
                    }

                    this._calculateField(changingValue);
                    this._setIfCanBuyOrder();
                });
            }

            /**
             * @param {object} newState
             * @private
             */
            _applyState(newState) {
                keys(newState).forEach(key => {
                    this[key] = newState[key];
                });
                this.order.$setDirty();
            }


            /**
             * @param {function} cb
             * @private
             */
            _setSilence(cb) {
                this._silenceNow = true;
                cb();
                this._silenceNow = false;
            }


            /**
             * @param {string} fieldName
             * @private
             */
            _calculateField(fieldName) {
                switch (fieldName) {
                    case 'total':
                        this._calculateTotal();
                        break;
                    case 'price':
                        this._calculatePrice();
                        break;
                    case 'amount':
                        this._calculateAmount();
                        break;
                    default:
                        break;
                }
            }

            /**
             * @private
             */
            _calculateTotal() {
                if (!this.price || !this.amount) {
                    return null;
                }
                const price = this._validPrice();
                const amount = this._validAmount();
                this._setDirtyField('total', this.priceBalance.cloneWithTokens(
                    price.times(amount)
                ));
                this._silenceNow = true;
            }

            /**
             * @private
             */
            _calculatePrice() {
                if (!this.total || !this.amount) {
                    return null;
                }
                const total = this._validTotal();
                const amount = this._validAmount();
                this._setDirtyField('price', this.priceBalance.cloneWithTokens(
                    total.div(amount)
                ));
                this._silenceNow = true;
            }

            /**
             * @private
             */
            _calculateAmount() {
                if (!this.total || !this.price) {
                    return null;
                }
                const total = this._validTotal();
                const price = this._validPrice();

                this._setDirtyField('amount', this.amountBalance.cloneWithTokens(
                    total.div(price)
                ));
                this._silenceNow = true;
            }

            /**
             * @private
             */
            _validTotal() {
                return this.order.total.$viewValue === '' ?
                    this.priceBalance.cloneWithTokens('0').getTokens() :
                    this.total.getTokens();
            }

            /**
             * @private
             */
            _validPrice() {
                return this.order.price.$viewValue === '' ?
                    this.amountBalance.cloneWithTokens('0').getTokens() :
                    this.price.getTokens();
            }

            /**
             * @private
             */
            _validAmount() {
                return this.order.amount.$viewValue === '' ?
                    this.amountBalance.cloneWithTokens('0').getTokens() :
                    this.amount.getTokens();
            }

            /**
             * @private
             */
            _setIfCanBuyOrder() {
                if (this.type === 'buy' &&
                    this.total &&
                    this.priceBalance &&
                    this.total.asset.id === this.priceBalance.asset.id) {

                    if (this.maxPriceBalance) {
                        this.canBuyOrder = (
                            this.total.lte(this.maxPriceBalance) && this.maxPriceBalance.getTokens().gt(0)
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
                this.loadingError = false;
                return waves.matcher.getOrderBook(this._assetIdPair.amount, this._assetIdPair.price)
                    .then(({ bids, asks, spread }) => {
                        const [lastAsk] = asks;
                        const [firstBid] = bids;

                        return { lastAsk, firstBid, spread };
                    }).catch(() => (this.loadingError = true));
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
             * @param {string} field
             * @param {Money} value
             * @private
             */
            _setDirtyField(field, value) {
                if (value.getTokens().isNaN() || !value.getTokens().isFinite()) {
                    return null;
                }
                this[field] = value;
                this.order.$setDirty();
            }

            _setPairRestrictions() {
                if (!this.loaded) {
                    return false;
                }

                this.pairRestrictions = {};

                ds.api.matcher.getPairRestrictions({
                    amountAsset: this.amountBalance.asset,
                    priceAsset: this.priceBalance.asset
                }).then(info => {
                    if (info) {
                        this.pairRestrictions = Object.keys(info).reduce((pairRestriction, key) => {
                            if (typeof info[key] === 'string' || typeof info[key] === 'number') {
                                pairRestriction[key] = new BigNumber(info[key]);
                            } else {
                                pairRestriction[key] = info[key];
                            }
                            return pairRestriction;
                        }, Object.create(null));
                    } else {
                        const tickSize = new BigNumber(Math.pow(10, -this.priceBalance.asset.precision));
                        const stepSize = new BigNumber(Math.pow(10, -this.amountBalance.asset.precision));
                        const maxPrice = new BigNumber(Infinity);
                        const maxAmount = this.maxAmountBalance ?
                            this.maxAmountBalance.getTokens() :
                            new BigNumber(Infinity);
                        this.pairRestrictions = {
                            maxPrice,
                            maxAmount,
                            tickSize,
                            stepSize,
                            minPrice: tickSize,
                            minAmount: stepSize
                        };
                    }
                });
            }

            /**
             * @return {boolean}
             */
            _validateStepSize() {
                if (!this.amount) {
                    return false;
                }

                return this.amount.getTokens().modulo(this.pairRestrictions.stepSize).isZero();
            }

            /**
             * @return {boolean}
             */
            _validateTickSize() {
                const { tickSize, minPrice, maxPrice } = this.pairRestrictions;
                if (!this.price || this.price.getTokens().lte(minPrice) || this.price.getTokens().gte(maxPrice)) {
                    return true;
                }

                return this.price.getTokens().modulo(tickSize).isZero();
            }

            /**
             * @return {string}
             */
            roundPrice() {
                if (!this.loadedPairRestrictions || !this._price) {
                    return '';
                }

                const price = this._price.getTokens();
                const { tickSize, minPrice, maxPrice } = this.pairRestrictions;
                const roundedPrice = price.decimalPlaces(-tickSize.e, BigNumber.ROUND_HALF_EVEN);

                if (roundedPrice.lt(minPrice)) {
                    return minPrice;
                }

                if (roundedPrice.gt(maxPrice)) {
                    return maxPrice;
                }

                return roundedPrice;
            }

            /**
             * @param {Money} value
             * @return {string}
             */
            roundAmount(value) {
                if (!this.loadedPairRestrictions || !this._amount) {
                    return '';
                }
                const amount = value ? value : this._amount.getTokens();
                const { stepSize, minAmount, maxAmount } = this.pairRestrictions;
                const roundedAmount = amount.decimalPlaces(-stepSize.e, BigNumber.ROUND_HALF_EVEN);

                if (roundedAmount.lt(minAmount)) {
                    return minAmount;
                }

                if (roundedAmount.gt(maxAmount)) {
                    return maxAmount;
                }

                return roundedAmount;
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
