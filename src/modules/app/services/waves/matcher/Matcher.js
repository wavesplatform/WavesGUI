(function () {
    'use strict';

    const factory = function () {

        class Matcher {

            getOrderbooks() {

            }

            getOrderbook() {

            }

        }

        return new Matcher();
    };

    factory.$inject = [];

    angular.module('app').factory('matcher', factory);
})();
