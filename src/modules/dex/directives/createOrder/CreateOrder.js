(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @param {app.utils} utils
     * @param {function} createPoll
     * @param {JQuery} $element
     * @return {CreateOrder}
     */
    const controller = function (Base, waves, utils, createPoll, $element) {

        class CreateOrder extends Base {

            constructor() {
                super();

                this.step = 0;
                this.type = null;

                this.observe(['_amountAssetId', '_priceAssetId'], () => {
                    utils.whenAll([
                        waves.node.assets.balance(this._amountAssetId),
                        waves.node.assets.balance(this._priceAssetId)
                    ]).then(([amountAsset, priceAsset]) => {
                        this.amountAsset = amountAsset;
                        this.priceAsset = priceAsset;
                    });
                });

                this.syncSettings({
                    _amountAssetId: 'dex.amountAssetId',
                    _priceAssetId: 'dex.priceAssetId'
                });

                createPoll(this, this._getData, this._setData, 1000);
            }

            $postLink() {

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
                setTimeout(() => { // TODO! Do. Author Tsigel at 29/11/2017 20:57
                    $element.find('input[name="amount"]').focus();
                }, 600);
            }

            collapse() {
                this.type = null;
                this.step = 0;
            }

            _getData() {

                return Waves.AssetPair.get(this._amountAssetId, this._priceAssetId)
                    .then((pair) => {

                        const parse = function (list) {
                            return Promise.all((list || [])
                                .map((item) => Promise.all([
                                    Waves.Money.fromCoins(String(item.amount), pair.amountAsset)
                                        .then((amount) => amount.getTokens()),
                                    Waves.OrderPrice.fromMatcherCoins(String(item.price), pair)
                                        .then((orderPrice) => orderPrice.getTokens())
                                ])
                                    .then((amountPrice) => {
                                        const amount = amountPrice[0];
                                        const price = amountPrice[1];
                                        const total = amount.mul(price);
                                        return {
                                            amount: amount.toFixed(pair.amountAsset.precision),
                                            price: price.toFixed(pair.priceAsset.precision),
                                            total: total.toFixed(pair.priceAsset.precision)
                                        };
                                    })));
                        };

                        return Waves.API.Matcher.v1.getOrderbook(pair.amountAsset.id, pair.priceAsset.id)
                            .then((orderBook) => Promise.all([parse(orderBook.bids), parse(orderBook.asks)])
                                .then(([bids, asks]) => {

                                    const [lastAsk] = asks;
                                    const [firstBid] = bids;

                                    const spread = firstBid && lastAsk && {
                                        amount: new BigNumber(lastAsk.amount).sub(firstBid.amount)
                                            .abs()
                                            .toString(),
                                        price: new BigNumber(lastAsk.price).sub(firstBid.price)
                                            .abs()
                                            .toString(),
                                        total: new BigNumber(lastAsk.total).sub(firstBid.total)
                                            .abs()
                                            .toString()
                                    };

                                    return { lastAsk, firstBid, spread };
                                }));
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

    controller.$inject = ['Base', 'waves', 'utils', 'createPoll', '$element'];

    angular.module('app.dex').component('wCreateOrder', {
        bindings: {},
        templateUrl: 'modules/dex/directives/createOrder/createOrder.html',
        transclude: false,
        controller
    });
})();
