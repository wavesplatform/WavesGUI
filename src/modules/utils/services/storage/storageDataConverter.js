(function () {
    'use strict';

    /**
     * @return {{parse: parse, stringify: stringify}} storageDataConverter
     */
    const factory = function () {
        const tsUtils = require('ts-utils');

        /**
         * @param {Object|string} data
         * @return {string}
         */
        function stringify(data) {
            switch (typeof data) {
                case 'string':
                    return data;
                case 'object':
                    try {
                        return myStringify(data);
                    } catch (e) {
                        return String(data);
                    }
                default:
                    return String(data);
            }
        }

        /**
         * @param {Object} data
         * @return {string}
         */
        function myStringify(data) {
            try {
                const paths = tsUtils.getPaths(data);
                return JSON.stringify(paths.reduce((result, item) => {
                    result[String(item)] = tsUtils.get(data, item);
                    return result;
                }, Object.create(null)));
            } catch (e) {
                return JSON.stringify(data);
            }
        }

        /**
         * @param {string|Object} data
         * @return {Object}
         */
        function parse(data) {
            if (typeof data === 'object') {
                let result;
                tsUtils.each(data, (value, path) => {
                    if (!result) {
                        result = tsUtils.Path.parse(path).getItemData(0).container;
                    }
                    tsUtils.set(result, path, value);
                });
                return result;
            } else {
                return data;
            }
        }

        return {
            stringify,
            parse
        };
    };

    angular.module('app.utils').factory('storageDataConverter', factory);
})();

