(function () {
    'use strict';

    const controller = function () {

        class Portfolio {

            constructor() {
                /**
                 * @type {Array}
                 */
                this.orders = null;
                this.positive = [];
                this.negative = [];
            }

            $onChanges(changes) {
                if (changes.orders) {
                    this._dorpOrders();

                }
            }

            _dorpOrders() {
                this.positive = [];
                this.negative = [];
            }
        }

        return new Portfolio();
    };

    controller.$inject = [];

    angular.module('app.dex')
        .component('wOrderBook', {
            bindings: {
                orders: '<'
            },
            templateUrl: '/modules/dex/directives/orderBook/orderBook.html'
        });
})();
