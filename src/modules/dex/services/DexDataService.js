(function () {
    'use strict';

    const factory = function (Base) {

        class DexDataService extends Base {

            constructor() {
                super();
                /**
                 * @type {Signal}
                 */
                this.chooseOrderBook = new tsUtils.Signal();
            }

        }


        return new DexDataService();
    };

    factory.$inject = ['Base'];

    angular.module('app.dex').factory('dexDataService', factory);
})();
