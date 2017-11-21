(function () {
    'use strict';

    const factory = function () {

        class Transactions {

            get(id) {

            }

            /**
             * Get transactions list by user
             * @param {boolean} includeUTX
             */
            list(includeUTX) {

            }

            utxSize() {

            }

            utxGet() {

            }

            utxList() {

            }

        }

        return new Transactions();
    };

    factory.$inject = [];

    angular.module('app').factory('transactions', factory);
})();
