(function () {
    'use strict';

    const tsUtils = require('ts-utils');

    const factory = function (Base) {

        /**
         * @class
         */
        class DexDataService extends Base {

            constructor() {
                super();
                /**
                 * @type {Signal}
                 */
                this.chooseOrderBook = new tsUtils.Signal();
                /**
                 * @type {Signal}
                 */
                this.showSpread = new tsUtils.Signal();
                /**
                 * @type {Signal}
                 */
                this.createOrder = new tsUtils.Signal();
            }

        }


        return new DexDataService();
    };

    factory.$inject = ['Base'];

    angular.module('app.dex').factory('dexDataService', factory);
})();
