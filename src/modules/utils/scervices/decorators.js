(function () {
    'use strict';

    const factory = function (utils) {


        return {
            readonly(target, key, descriptor) {
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
            cachable(time) {
                return function (target, key, descriptor) {
                    const origin = descriptor.value;
                    const cache = Object.create(null);

                    if (time > 0) {
                        descriptor.value = function (...args) {
                            const key = stringify(args);
                            if (cache[key] && cache[key].timer) {
                                return cache[key].value;
                            } else {
                                cache[key] = Object.create(null);
                                cache[key].value = origin.call(this, ...args);
                                if (cache[key].value.then && typeof cache[key].value.then === 'function') {
                                    cache[key].timer = 1;
                                    utils.resolve(cache[key].value).then(() => {
                                        cache[key].timer = setTimeout(() => {
                                            delete cache[key];
                                        }, time);
                                    });
                                } else {
                                    cache[key].timer = setTimeout(() => {
                                        delete cache[key];
                                    }, time);
                                }
                            }
                            return cache[key].value;
                        };
                    } else {
                        descriptor.value = function (...args) {
                            const key = stringify(args);
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

    factory.$inject = ['utils'];

    function stringify(some) {
        try {
            return JSON.stringify(some);
        } catch (e) {
            return String(some);
        }
    }

    angular.module('app.utils').factory('decorators', factory);
})();
