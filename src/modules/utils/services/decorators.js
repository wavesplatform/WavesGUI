/* global tsUtils */
(function () {
    'use strict';

    const tsUtils = require('ts-utils');

    /**
     * @param {TimeLine} timeLine
     * @return {*}
     */
    const factory = function (timeLine) {

        /**
         * @name app.utils.decorators
         */

        return {
            /**
             * @name app.utils.decorators#readonly
             * @param target
             * @param key
             * @param descriptor
             */
            readonly(target, key, descriptor) {
                // TODO fix for parents frozen!
                const origin = descriptor.value;
                descriptor.value = function (...args) {
                    const result = origin.call(this, ...args);
                    const paths = tsUtils.getPaths(result);
                    paths.forEach((path) => {
                        Object.freeze(tsUtils.get(result, path));
                    });
                    return result;
                };
            },

            /**
             * @name app.utils.decorators#scope
             * @param defaults
             * @return {Function}
             */
            scope(defaults) {
                return function (target, key, descriptor) {
                    const cache = defaults || Object.create(null);
                    const origin = descriptor.value;

                    descriptor.value = function (...args) {
                        args.push(cache);
                        return origin.call(this, ...args);
                    };
                };
            },

            /**
             * @name app.utils.decorators#async
             * @param timeout
             * @returns {Function}
             */
            async(timeout) {
                let addTimeout, dropTimeout;

                if (timeout) {
                    addTimeout = (cb) => setTimeout(cb, timeout);
                    dropTimeout = clearTimeout;
                } else {
                    addTimeout = requestAnimationFrame;
                    dropTimeout = cancelAnimationFrame;
                }

                return function (target, key, descriptor) {
                    const origin = descriptor.value;

                    descriptor.value = function (...args) {
                        if (this[`__${key}_timer`]) {
                            dropTimeout(this[`__${key}_timer`]);
                        }
                        this[`__${key}_timer`] = addTimeout(() => {
                            this[`__${key}_timer`] = null;
                            origin.call(this, ...args);
                        });
                    };
                };
            },

            /**
             * @name app.utils.decorators#cachable
             * @param time
             * @param {function(data: *): string} [toString]
             * @return {Function}
             */
            cachable(time, toString) {
                return function (target, key, descriptor) {
                    const origin = descriptor.value;
                    const cache = Object.create(null);

                    if (time > 0) {
                        descriptor.value = function (...args) {
                            const key = toString ? toString(args) : stringify(args);
                            if (cache[key] && cache[key]) {
                                return cache[key].value;
                            } else {
                                cache[key] = Object.create(null);
                                cache[key].value = origin.call(this, ...args);
                                if (cache[key].value &&
                                    cache[key].value.then &&
                                    typeof cache[key].value.then === 'function') {

                                    cache[key].value.catch(() => {
                                        timeLine.cancel(cache[key].timer);
                                        delete cache[key];
                                    });

                                    cache[key].value
                                        .then(() => {
                                            cache[key].timer = timeLine.timeout(() => {
                                                delete cache[key];
                                            }, time * 1000);
                                        });
                                } else {
                                    cache[key].timer = timeLine.timeout(() => {
                                        delete cache[key];
                                    }, time * 1000);
                                }
                            }
                            return cache[key].value;
                        };
                    } else {
                        // TODO : make it limited in size (say, 1000 elements)
                        descriptor.value = function (...args) {
                            const key = toString ? toString(args) : stringify(args);
                            if (cache[key]) {
                                return cache[key];
                            } else {
                                cache[key] = origin.call(this, ...args);
                            }
                            return cache[key];
                        };
                    }
                };
            }
        };

    };

    factory.$inject = ['timeLine'];

    /**
     * @param {Array} some
     */
    function stringify(some) {
        try {
            return JSON.stringify(some);
        } catch (e) {
            return String(some);
        }
    }

    angular.module('app.utils')
        .factory('decorators', factory);
})();
