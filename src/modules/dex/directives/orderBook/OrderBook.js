(function () {
    'use strict';

    const controller = function (utils) {

        class OrderBook extends utils.Base {

            constructor() {
                super();
                this._by = [];
                this._sell = [];
                this.observe(['_by', '_sell'], () => this._currentOrders());
            }

            _currentOrders() {
                const filter = function (item) {
                    const clone = { ...item };
                    clone.total = clone.size * clone.price;
                    return clone;
                };
                this.by = this._by.map(filter);
                this.sell = this._sell.map(filter);
            }

        }

        return new OrderBook();
    };

    controller.$inject = ['utils'];

    angular.module('app.dex')
        .component('wDexOrderBook', {
            bindings: {
                amountAsset: '<',
                priceAsset: '<',
                _by: '<by',
                _sell: '<sell'
            },
            templateUrl: '/modules/dex/directives/orderBook/orderBook.html',
            controller
        });
})();
