(function () {
    'use strict';

    const factory = function () {
        return {
            revert: new tsUtils.Signal(),
            pick: new tsUtils.Signal(),
            clear: new tsUtils.Signal()
        };
    };

    factory.$inject = [];

    angular.module('app.ui').factory('seedService', factory);
})();

/**
 * @typedef {object} ISeedService
 * @property {Signal} revert
 * @property {Signal} pick
 * @property {Signal} clear
 */
