(function () {
    'use strict';

    /**
     * @name app.utils
     */

    /**
     * @param $q
     * @param Moment
     * @return {app.utils}
     */
    const factory = function ($q, Moment) {

        const utils = {

            /**
             * @name app.utils#observe
             * @param {object} target
             * @param {string} key
             * @return {Signal}
             */
            observe(target, key) {
                const __ = target.__ || Object.create(null);
                if (!target.__) {
                    Object.defineProperty(target, '__', {
                        writable: false,
                        configurable: false,
                        enumerable: false,
                        value: __
                    });
                }

                if (!__[key]) {
                    __[key] = {
                        signal: new tsUtils.Signal(),
                        value: target[key]
                    };

                    Object.defineProperty(target, key, {
                        enumerable: true,
                        get: () => __[key].value,
                        set: (value) => {
                            const oldValue = __[key].value;
                            if (oldValue !== value) {
                                __[key].value = value;
                                __[key].signal.dispatch(oldValue);
                            }
                        }
                    });

                    return __[key].signal;
                } else {
                    return __[key].signal;
                }

            },

            /**
             * @name app.utils#when
             * @param {*} data
             * @return {Promise}
             */
            when(data) {
                if (data && data.then && typeof data.then === 'function') {
                    const defer = $q.defer();
                    data.then(defer.resolve, defer.reject);
                    return defer.promise;
                } else {
                    return $q.when(data);
                }
            },

            /**
             * @name app.utils#whenAll
             * @param {Array<Promise>} promises
             * @return {Promise}
             */
            whenAll(promises) {
                return utils.when(Promise.all(promises));
            },

            /**
             * @name app.utils#isEqual
             * @param a
             * @param b
             * @return {boolean}
             */
            isEqual(a, b) {
                const typeA = typeof a;
                const typeB = typeof b;

                if (typeA !== typeB) {
                    return false;
                }

                if (typeA !== 'object') {
                    return a === b;
                }

                const pathsA = tsUtils.getPaths(a);
                const pathsB = tsUtils.getPaths(b);

                return pathsA.length === pathsB.length && pathsA.every((path, index) => {
                    return tsUtils.get(a, path) === tsUtils.get(b, path) && (String(path) === String(pathsB[index]));
                });
            },

            /**
             * @name app.utils#bind
             * @param {object} target
             * @param {Array<string>|string} [keys]
             * @return {object}
             */
            bind(target, keys) {
                if (keys == null) {
                    keys = Object.keys(target);
                    if (keys.length === 0) {
                        const proto = Object.getPrototypeOf(target);
                        keys = Object.getOwnPropertyNames(proto)
                            .filter((method) => {
                                return method.charAt(0) !== '_' && method !== 'constructor';
                            });
                    } else {
                        keys = keys.filter((key) => typeof target[key] === 'function');
                    }
                } else {
                    keys = Array.isArray(keys) ? keys : [keys];
                }

                keys.forEach((key) => {
                    target[key] = target[key].bind(target);
                });
                return target;
            },

            /**
             * @name app.utils#resolve
             * @param {{then: Function}} promiseLike
             * @return {Promise}
             */
            resolve(promiseLike) {
                const getCallback = (state, resolve) => {
                    return (data) => resolve({ state, data });
                };
                return $q((resolve) => {
                    promiseLike.then(getCallback(true, resolve), getCallback(false, resolve));
                });
            },

            /**
             * @name app.utils#moment
             * @param {Date | number | string} [date]
             * @param {string} [pattern]
             * @return {Moment}
             */
            moment(date, pattern) {
                return new Moment(date, pattern);
            },

            /**
             * @name app.utils#loadImage
             * @param {string} url
             * @return {Promise}
             */
            loadImage(url) {
                return $q((resolve, reject) => {
                    const img = new Image(url);
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = url;
                });
            },

            /**
             * @name app.utils#getNiceNumber
             * @param num
             * @param precision
             * @returns {string}
             */
            getNiceNumber(num, precision) {
                return utils.parseNiceNumber(num)
                    .toLocaleString(i18next.language, {
                        minimumFractionDigits: precision
                    });
            },

            /**
             * @name app.utils#parseNiceNumber
             * @param data
             * @returns {number}
             */
            parseNiceNumber(data) {
                return Number(String(data)
                    .replace(',', '')
                    .replace(/\s/g, '')) || 0;
            },

            /**
             * @name app.utils#toArray
             * @param {*} some
             * @return {[*]}
             */
            toArray(some) {
                return Array.isArray(some) ? some : [some];
            }
        };

        return utils;
    };

    factory.$inject = ['$q', 'Moment'];

    angular.module('app.utils')
        .factory('utils', factory);
})();

