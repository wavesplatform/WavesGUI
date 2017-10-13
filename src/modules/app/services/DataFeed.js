(function () {
    'use strict';

    const factory = function (decorators) {

        class DataFeed {

            /**
             * @param {string} amount amount asset id
             * @param {string} price price asset id
             * @param {number} [count] blocks count (default 50)
             * @return {Promise}
             */
            @decorators.cachable(2)
            trades(amount, price, count) {
                count = count || 50;
                return fetch(`${WavesApp.network.datafeed}/api/trades/${amount}/${price}/${count}`)
                    .then(r => r.json());
            }

            /**
             * @param {string} amount amount asset id
             * @param {string} price price asset id
             * @param {number} [interval] from last $interval$ minutes (default 30)
             * @param {number} [count] blocks count (default 100)
             * @promise
             */
            @decorators.cachable(2)
            candles(amount, price, interval, count) {
                interval = interval || 30;
                count = count || 100;
                return fetch(`${WavesApp.network.datafeed}/api/candles/${amount}/${price}/${interval}/${count}`)
                    .then(r => r.json());
            }

        }

        return new DataFeed();
    };

    factory.$inject = ['decorators'];

    angular.module('app')
        .factory('dataFeed', factory);
})();
