(function () {
    'use strict';

    /**
     * @param decorators
     * @return {DataFeed}
     */
    const factory = function (decorators) {

        // TODO Refactor. Author Tsigel at 22/11/2017 08:24

        class DataFeed {

            /**
             * @param {string} amount amount asset id
             * @param {string} price price asset id
             * @param {number} [count] blocks count (default 50)
             * @return {Promise<Array<DataFeed.ITrade>>}
             */
            @decorators.cachable(2)
            trades(amount, price, count) {
                count = count || 50;
                return ds.api.pairs.get(amount, price)
                    .then((pair) => ds.fetch(`${WavesApp.network.datafeed}/api/trades/${pair.toString()}/${count}`));
            }

            /**
             * @param {string} amount amount asset id
             * @param {string} price price asset id
             * @param {number} [interval] from last $interval$ minutes (default 30)
             * @param {number} [count] blocks count (default 100)
             * @promise
             * TODO : deprecated
             */
            @decorators.cachable(2)
            candles(amount, price, interval, count) {
                interval = interval || 30;
                count = count || 100;
                return ds.fetch(`${WavesApp.network.datafeed}/api/candles/${amount}/${price}/${interval}/${count}`)
                    .then((r) => r.json());
            }

            /**
             * TODO : deprecated
             */
            @decorators.cachable(2)
            candlesFrame(amount, price, interval, from, to) {
                return ds.fetch(`${WavesApp.network.datafeed}/api/candles/${amount}/${price}/${interval}/${from}/${to}`)
                    .then((r) => r.json());
            }

        }

        return new DataFeed();
    };

    factory.$inject = ['decorators'];

    angular.module('app').factory('dataFeed', factory);
})();

/**
 * @name DataFeed
 */

/**
 * @typedef {object} DataFeed#ITrade
 * @property {string} amount
 * @property {string} buyer
 * @property {boolean} confirmed
 * @property {string} id
 * @property {string} matcher
 * @property {string} price
 * @property {string} seller
 * @property {string} type
 * @property {number} timestamp
 */
