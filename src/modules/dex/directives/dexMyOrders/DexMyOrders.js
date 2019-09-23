(function () {
    'use strict';

    const { SIGN_TYPE } = require('@waves/signature-adapter');
    const { filter, whereEq, uniqBy, prop, where, gt, pick, __, map } = require('ramda');
    const ds = require('data-service');
    const { BigNumber } = require('@waves/bignumber');
    const MAX_EXCHANGE_COUNT = 2000;
    const { Money } = require('@waves/data-entities');

    /**
     * @param Base
     * @param {Waves} waves
     * @param {User} user
     * @param {IPollCreate} createPoll
     * @param {INotification} notification
     * @param {app.utils} utils
     * @param {$rootScope.Scope} $scope
     * @param {DexDataService} dexDataService
     * @param {ModalManager} modalManager
     * @param {PermissionManager} permissionManager,
     * @param {Ease} ease
     * @param {JQuery} $element
     * @param {Transactions} transactions
     * @return {DexMyOrders}
     */
    const controller = function (
        Base,
        waves,
        user,
        createPoll,
        notification,
        utils,
        $scope,
        dexDataService,
        modalManager,
        permissionManager,
        ease,
        $element,
        transactions
    ) {

        /**
         * @class
         */
        class DexMyOrders extends Base {

            /**
             * @type {{amount: string, price: string}}
             * @private
             */
            _assetIdPair;
            /**
             * @type {Promise<string>}
             * @private
             */
            _matcherPublicKeyPromise = ds.fetch(user.getSetting('network.matcher'));
            /**
             * @type {Array<IDexOrders>}
             */
            orders = [];
            /**
             * @type {boolean}
             */
            isDemo = !user.address;
            /**
             * @type {boolean}
             */
            pending = !!user.address;
            /**
             * @type {boolean}
             */
            loadingError = false;
            /**
             * @type {boolean}
             */
            showAnimations = false;
            /**
             * @type {boolean}
             */
            isActiveOrders = false;
            /**
             * @type {Array}
             */
            userList = [];


            constructor() {
                super();

                this.syncSettings({
                    _assetIdPair: 'dex.assetIdPair',
                    _matcherUrl: 'network.matcher'
                });

                this.observe('_matcherUrl', () => {
                    this._matcherPublicKeyPromise = ds.fetch(user.getSetting('network.matcher'));
                });

                user.getMultiAccountUsers().then(list => {
                    this.userList = list;
                });
            }

            $postLink() {
                this.headers = [
                    {
                        id: 'pair',
                        valuePath: 'item.pair',
                        search: true,
                        placeholder: 'directives.filter'
                    },
                    {
                        id: 'type',
                        title: { literal: 'directives.myOrders.type' },
                        valuePath: 'item.type',
                        sort: true
                    },
                    {
                        id: 'time',
                        title: { literal: 'directives.myOrders.time' },
                        valuePath: 'item.timestamp',
                        sort: true,
                        sortActive: true,
                        isAsc: false
                    },
                    {
                        id: 'amount',
                        title: { literal: 'directives.myOrders.amount' },
                        valuePath: 'item.amount',
                        sort: true
                    },
                    {
                        id: 'price',
                        title: { literal: 'directives.myOrders.price' },
                        valuePath: 'item.price',
                        sort: true
                    },
                    {
                        id: 'average',
                        title: { literal: 'directives.myOrders.average' },
                        valuePath: 'item.average',
                        sort: true
                    },
                    {
                        id: 'total',
                        title: { literal: 'directives.myOrders.total' },
                        valuePath: 'item.total',
                        sort: true
                    },
                    {
                        id: 'filled',
                        title: { literal: 'directives.myOrders.filled' },
                        valuePath: 'item.filledTotal',
                        sort: true
                    },
                    {
                        id: 'fee',
                        title: { literal: 'directives.myOrders.tableTitle.fee' },
                        valuePath: 'item.userFee',
                        sort: true
                    },
                    {
                        id: 'status',
                        title: { literal: 'directives.myOrders.status' },
                        valuePath: 'item.progress',
                        sort: true
                    },
                    this.isActiveOrders && {
                        id: 'controls',
                        templatePath: 'modules/dex/directives/dexMyOrders/header-control-cell.html',
                        scopeData: {
                            cancelAllOrdersClick: () => {
                                this.cancelAllOrders();
                            },
                            $ctrl: this
                        }
                    } || null
                ].filter(Boolean);

                if (!this.isDemo) {
                    const poll = createPoll(this, this._getAllOrders, this._setOrders, 1000);
                    poll.ready.then(() => {
                        this.pending = false;
                    });
                    this.receive(dexDataService.createOrder, () => poll.restart());
                    this.poll = poll;
                }
            }

            /**
             * @param {IOrder} order
             */
            setPair(order) {
                if (this.isLockedPair(order.assetPair.amountAsset.id, order.assetPair.priceAsset.id)) {
                    return null;
                }
                user.setSetting('dex.assetIdPair', {
                    amount: order.assetPair.amountAsset.id,
                    price: order.assetPair.priceAsset.id
                });
            }

            cancelAllOrders() {
                if (!permissionManager.isPermitted('CAN_CANCEL_ORDER')) {
                    const $notify = $element.find('.js-order-notification');
                    DexMyOrders._animateNotification($notify);
                    return null;
                }

                ds.cancelAllOrders({
                    sender: user.publicKey,
                    timestamp: user.matcherSign.timestamp,
                    signature: user.matcherSign.signature
                })
                    .then(() => {
                        notification.info({
                            ns: 'app.dex',
                            title: { literal: 'directives.myOrders.notifications.canceledAll' }
                        });

                        if (this.poll) {
                            this.poll.restart();
                        }
                    })
                    .catch(e => {
                        const error = utils.parseError(e);
                        notification.error({
                            ns: 'app.dex',
                            title: { literal: 'directives.myOrders.notifications.somethingWentWrong' },
                            body: { literal: error && error.message || error }
                        });
                    });
            }

            /**
             * @param data
             * @return {number}
             */
            round(data) {
                return Math.round(Number(data));
            }

            /**
             * @param {IOrder} order
             * @return boolean
             */
            isSelected(order) {
                return this._assetIdPair.amount === order.amount.asset.id &&
                    this._assetIdPair.price === order.price.asset.id;
            }

            isLockedPair(amountAssetId, priceAssetId) {
                return utils.isLockedInDex(amountAssetId, priceAssetId);
            }

            /**
             *
             * @param order
             * @return {Promise<Object | never>}
             */
            dropOrderGetSignData(order) {
                const { id } = order;
                const data = { id };
                const signable = ds.signature.getSignatureApi().makeSignable({
                    type: SIGN_TYPE.CANCEL_ORDER,
                    data
                });

                return utils.signMatcher(signable)
                    .then(signable => signable.getDataForApi());
            }

            /**
             * @param order
             */
            dropOrder(order) {
                if (!permissionManager.isPermitted('CAN_CANCEL_ORDER')) {
                    const $notify = $element.find('.js-order-notification');
                    DexMyOrders._animateNotification($notify);
                    return null;
                }

                const dataPromise = this.dropOrderGetSignData(order);

                const classNameToOrder = (className, isRemove = false) => {
                    const $row = $element.find(`.order_${order.id}`).closest('.order-row');

                    if (isRemove) {
                        $row.removeClass(className);
                    } else {
                        $row.addClass(className);
                    }
                };

                classNameToOrder('pre-leave');

                dataPromise
                    .then((signedTxData) => ds.cancelOrder(signedTxData, order.amount.asset.id, order.price.asset.id))
                    .then(() => {
                        classNameToOrder('force-leave');
                        const canceledOrder = this.orders.find(whereEq({ id: order.id }));
                        canceledOrder.state = 'Canceled';
                        notification.info({
                            ns: 'app.dex',
                            title: { literal: 'directives.myOrders.notifications.isCanceled' }
                        });

                        if (this.poll) {
                            this.poll.restart();
                        }
                    })
                    .catch(e => {
                        classNameToOrder('pre-leave', true);
                        const error = utils.parseError(e);
                        notification.error({
                            ns: 'app.dex',
                            title: { literal: 'directives.myOrders.notifications.somethingWentWrong' },
                            body: { literal: error && error.message || error }
                        });
                    });
            }

            /**
             * @param {Array<IDexOrders>} orders
             * @private
             */
            _setOrders(orders) {
                let needApply = false;

                orders.forEach(order => {
                    const isNew = DexMyOrders._isNewOrder(order.timestamp.getTime());
                    needApply = needApply || isNew !== order.isNew;
                    order.isNew = isNew;
                });

                if (needApply) {
                    $scope.$apply();
                }

                this.orders = orders;

                this.showAnimations = true;
            }

            /**
             * @return {Promise<Array<IDexOrders>>}
             * @private
             */
            _getAllOrders() {
                return waves.matcher.getOrders({ isActive: this.isActiveOrders })
                    .then(filter(whereEq({ isActive: this.isActiveOrders })))
                    .then(map(order => ({ ...order, isCancelled: order.status === 'Cancelled' })))
                    .then(orders => {
                        if (this._isEqualOrders(orders) && this._isAllPartialFilledOrdersHasTransactions()) {
                            return this.orders;
                        }

                        return this._matcherPublicKeyPromise
                            .then(matcherPublicKey =>
                                Promise.all(orders.map(DexMyOrders._remapOrders(matcherPublicKey)))
                            )
                            .then(result => {
                                const lastOrder = result.slice().reverse().find(where({ progress: gt(__, 0) }));
                                const exchanges = lastOrder ?
                                    DexMyOrders._loadTransactions(lastOrder.timestamp.getTime()) :
                                    Promise.resolve([]);

                                return exchanges.then(txList => {
                                    const hash = DexMyOrders._getTransactionsByOrderIdHash(txList);
                                    this.loadingError = false;
                                    return result.map(order => {
                                        if (!hash[order.id]) {
                                            hash[order.id] = [];
                                        }
                                        order.exchange = hash[order.id];
                                        order.average =
                                            DexMyOrders._getAveragePriceByExchange(order, order.exchange);
                                        order.filledTotal = order.price.cloneWithTokens(
                                            order.average.getTokens().mul(order.filled.getTokens())
                                        );

                                        return order;
                                    });
                                }).catch(() => result);
                            });
                    })
                    .catch(() => {
                        this.loadingError = true;
                        return [];
                    });
            }

            /**
             * @param {Array<IOrder>} newOrders
             * @return {boolean}
             * @private
             */
            _isEqualOrders(newOrders) {
                return this.orders.length === newOrders.length && this.orders
                    .every((item, i) => whereEq(pick(['id', 'progress'], item), newOrders[i]));
            }

            /**
             * @return {boolean}
             * @private
             */
            _isAllPartialFilledOrdersHasTransactions() {
                const minTimestamp = DexMyOrders._getMinTimestamp();
                let exchangeCount = 0;
                return this.orders
                    .filter(where({
                        progress: gt(__, 0),
                        timestamp: gt(__, minTimestamp)
                    }))
                    .every(order => {
                        exchangeCount += order.exchange.length;
                        return order.exchange.length &&
                            order.filled.eq(
                                order.exchange
                                    .map(tx => tx.amount)
                                    .reduce((acc, amount) => acc.add(amount))
                            ) || exchangeCount >= MAX_EXCHANGE_COUNT;
                    });
            }

            /**
             * @param {IOrder} order
             * @param {Array<IExchange>} exchangeList
             * @private
             */
            static _getAveragePriceByExchange(order, exchangeList) {
                if (!exchangeList.length) {
                    return order.price;
                }

                const sum = exchangeList
                    .map(tx => ({
                        amount: tx.amount.getTokens(),
                        total: tx.total.getTokens()
                    }))
                    .reduce((acc, item) => ({
                        amount: acc.amount.add(item.amount),
                        total: acc.total.add(item.total)
                    }), {
                        amount: new BigNumber(0),
                        total: new BigNumber(0)
                    });

                return order.price.cloneWithTokens(sum.total.div(sum.amount));
            }

            /**
             * @param $element
             * @return {Promise}
             * @private
             */
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

            /**
             * @param txList
             * @return {Record<string, Array>}
             * @private
             */
            static _getTransactionsByOrderIdHash(txList) {
                const uniqueList = uniqBy(prop('id'), txList);
                const transactionsByOrderHash = Object.create(null);
                uniqueList.forEach((tx) => {
                    ['order1', 'order2'].forEach((orderFieldName) => {
                        if (!transactionsByOrderHash[tx[orderFieldName].id]) {
                            transactionsByOrderHash[tx[orderFieldName].id] = [];
                        }
                        transactionsByOrderHash[tx[orderFieldName].id].push(DexMyOrders._remapTx(tx));
                    });
                });
                return transactionsByOrderHash;
            }

            static _remapTx(tx) {
                const fee = (tx, order) => order.orderType === 'sell' ? tx.sellMatcherFee : tx.buyMatcherFee;
                const userFee = [tx.order1, tx.order2]
                    .reduce((acc, order) => {
                        acc[order.orderType] = fee(tx, order);
                        return acc;
                    }, Object.create(null));

                return { ...tx, userFee };
            }

            /**
             * @param {IOrder} order
             * @private
             */
            static _remapOrders(matcherPublicKey) {
                return order => {
                    const assetPair = order.assetPair;
                    const pair = `${assetPair.amountAsset.displayName} / ${assetPair.priceAsset.displayName}`;
                    const isNew = DexMyOrders._isNewOrder(order.timestamp.getTime());
                    const percent = new BigNumber(order.progress * 100).toFixed(2);
                    const feeAsset = order.feeAsset || order.matcherFeeAssetId || 'WAVES';
                    const matcherFee = order.fee || order.matcherFee;
                    if (matcherFee) {
                        if (matcherFee instanceof Money) {
                            return Promise.resolve({ ...order, isNew, percent, pair, fee: matcherFee });
                        }

                        return ds.api.assets.get(feeAsset).then(asset => {
                            const fee = new Money(matcherFee, asset);
                            return { ...order, isNew, percent, pair, fee };
                        });
                    }

                    return waves.matcher.getCreateOrderFee({ ...order, matcherPublicKey })
                        .then(fee => ({ ...order, isNew, percent, pair, fee }));
                };
            }

            /**
             * @param {number} timestamp
             * @return {boolean}
             * @private
             */
            static _isNewOrder(timestamp) {
                return ds.utils.normalizeTime(Date.now()) < timestamp + 1000 * 8;
            }

            /**
             * @param {number} lastTime
             * @return {Promise<Array<IExchange>>}
             * @private
             */
            static _loadTransactions(lastTime) {
                const minTime = DexMyOrders._getMinTimestamp();
                return transactions.getExchangeTxList({
                    sender: user.address,
                    timeStart: ds.utils.normalizeTime(minTime < lastTime ? lastTime : minTime)
                }, { getAll: true, limit: MAX_EXCHANGE_COUNT });
            }

            /**
             * @return {number}
             * @private
             */
            static _getMinTimestamp() {
                const today = new Date();
                return new Date(
                    today.getFullYear(),
                    today.getMonth() - 2,
                    today.getDate(),
                    today.getHours(),
                    today.getMinutes()
                ).getTime();
            }

        }

        return new DexMyOrders();
    };

    controller.$inject = [
        'Base',
        'waves',
        'user',
        'createPoll',
        'notification',
        'utils',
        '$scope',
        'dexDataService',
        'modalManager',
        'permissionManager',
        'ease',
        '$element',
        'transactions'
    ];

    angular.module('app.dex').component('wDexMyOrders', {
        bindings: {
            isActiveOrders: '<'
        },
        templateUrl: 'modules/dex/directives/dexMyOrders/myOrders.html',
        controller
    });
})();

/**
 * @typedef {IOrder} IDexOrders
 * @property {boolean} isNew
 * @property {string} pair
 * @property {Array} exchange
 */
