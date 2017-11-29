(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @param {app.utils} utils
     * @return {CreateOrder}
     */
    const controller = function (Base, waves, utils, createPoll) {

        class CreateOrder extends Base {

            constructor() {
                super();

                this.step = 0;
                this.type = null;

                this.observe(['_amountAssetId', '_priceAssetId'], () => {
                    utils.whenAll([
                        waves.node.assets.info(this._amountAssetId),
                        waves.node.assets.info(this._priceAssetId)
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
                this.step++;
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

                                    const lastAsk = asks[asks.length - 1];
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

            }

        }

        return new CreateOrder();
    };

    controller.$inject = ['Base', 'waves', 'utils', 'createPoll'];

    angular.module('app.dex').component('wCreateOrder', {
        bindings: {},
        templateUrl: 'modules/dex/directives/createOrder/createOrder.html',
        transclude: false,
        controller
    });
})();
