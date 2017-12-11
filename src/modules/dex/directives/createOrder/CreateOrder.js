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

            constructor() {
                super();

                this.step = 0;

                this.amountAsset = null;
                this.priceAsset = null;
                this.amountDisplayName = null;
                this.priceDisplayName = null;
                /**
                 * @type {Money}
                 */
                this.amountBalance = null;
                /**
                 * @type {Money}
                 */
                this.priceBalance = null;

                Waves.Money.fromTokens('0.003', WavesApp.defaultAssets.WAVES).then((money) => {
                    this.fee = money;
                });

                this.type = null;
                /**
                 * @type {string}
                 * @private
                 */
                this._priceAssetId = null;
                /**
                 * @type {string}
                 * @private
                 */
                this._amountAssetId = null;

                this.receive(dexDataService.chooseOrderBook, ({ type, price, amount }) => {
                    this.type = type;
                    this.step = 1;
                    amount = new BigNumber(amount);

                    if (this.amountBalance && this.amountBalance.getTokens().lt(amount)) {
                        this.amount = this.amountBalance.getTokens();
                    } else {
                        this.amount = amount;
                    }

                    this.amount = new BigNumber(amount);
                    this.price = new BigNumber(price);
                    $scope.$apply();
                });

                this.observe(['_amountAssetId', '_priceAssetId'], () => {

                    if (!this._priceAssetId || !this._amountAssetId) {
                        return null;
                    }

                    this.amount = null;
                    this.price = null;
                    Waves.AssetPair.get(this._amountAssetId, this._priceAssetId).then((pair) => {
                        return utils.whenAll([
                            waves.node.assets.balance(pair.amountAsset.id),
                            waves.node.assets.balance(pair.priceAsset.id)
                        ]).then(([amountMoney, priceMoney]) => {
                            const amountAsset = amountMoney.asset;
                            const priceAsset = priceMoney.asset;

                            this.amountBalance = amountMoney;
                            this.priceBalance = priceMoney;
                            this.amountAsset = amountAsset;
                            this.priceAsset = priceAsset;
                            this.amountDisplayName = amountAsset.displayName;
                            this.priceDisplayName = priceAsset.displayName;
                        });
                    });
                });

                this.syncSettings({
                    _amountAssetId: 'dex.amountAssetId',
                    _priceAssetId: 'dex.priceAssetId'
                });

                // TODO Add directive for stop propagation (catch move for draggable)
                $element.on('mousedown', '.body', (e) => {
                    e.stopPropagation();
                });

                createPoll(this, this._getData, this._setData, 1000);
            }

            expand(type) {
                this.type = type;
                this.step = 1;
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
                setTimeout(() => { // TODO Do. Author Tsigel at 29/11/2017 20:57
                    $element.find('input[name="amount"]').focus();
                }, 600);
            }

            setMaxAmount() {
                if (this.amountAsset.id === this.fee.asset.id) {
                    this.amount = this.amountBalance.sub(this.fee).getTokens()
                        .round(this.amountAsset.precision, BigNumber.ROUND_FLOOR);
                } else {
                    this.amount = this.amountBalance.getTokens()
                        .round(this.amountAsset.precision, BigNumber.ROUND_FLOOR);
                }
            }

            setMaxPrice() {
                if (this.priceAsset.id === this.fee.asset.id) {
                    this.amount = this.priceBalance.sub(this.fee)
                        .getTokens()
                        .div(this.price)
                        .round(this.amountAsset.precision, BigNumber.ROUND_FLOOR);
                } else {
                    this.amount = this.priceBalance.getTokens()
                        .div(this.price)
                        .round(this.amountAsset.precision, BigNumber.ROUND_FLOOR);
                }
            }

            collapse() {
                this.type = null;
                this.step = 0;
            }

            createOrder() {
                user.getSeed()
                    .then((seed) => {
                        return Waves.AssetPair.get(this._amountAssetId, this._priceAssetId).then((pair) => {
                            return Promise.all([
                                Waves.Money.fromTokens(this.amount.toFixed(), this.amountAsset.id),
                                Waves.OrderPrice.fromTokens(this.price.toFixed(), pair)
                            ]);
                        }).then(([amount, price]) => {
                            this.amount = null;
                            return waves.matcher.createOrder({
                                amountAsset: this.amountAsset.id,
                                priceAsset: this.priceAsset.id,
                                orderType: this.type,
                                price: price.toMatcherCoins(),
                                amount: amount.toCoins()
                            }, seed.keyPair);
                        }).then((res) => {
                            notificationManager.success({
                                ns: 'app',
                                title: { literal: 'The order is created' }
                            });
                        }).catch((err) => {
                            notificationManager.error({
                                ns: 'app',
                                title: { literal: 'Something went wrong' }
                            });
                        });
                    });
            }

            _getData() {

                return waves.matcher.getOrderBook(this._amountAssetId, this._priceAssetId)
                    .then(({ bids, asks, spread }) => {
                        const [lastAsk] = asks;
                        const [firstBid] = bids;

                        return { lastAsk, firstBid, spread };
                    });
            }

            _setData({ lastAsk, firstBid, spread }) {
                this.bid = firstBid;
                this.ask = lastAsk;
                this.spread = spread;

                const sell = Number(this.bid.price);
                const buy = Number(this.ask.price);

                this.spreadPercent = ((buy - sell) * 100 / buy).toFixed(2);
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
