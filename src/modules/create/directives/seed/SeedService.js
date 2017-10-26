(function () {
    'use strict';

    const factory = function () {
        return {
            revert: new tsUtils.Signal(),
            show: new tsUtils.Signal(),
            clear: new tsUtils.Signal()
        };
    };

    factory.$inject = [];

    angular.module('app.create').factory('seedService', factory);
})();

/**
 * @typedef {Object} ISeedService
 * @property {Signal} revert
 * @property {Signal} show
 * @property {Signal} clear
 */
