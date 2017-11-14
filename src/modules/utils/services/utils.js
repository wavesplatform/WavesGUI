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
    const factory = function ($q, Moment, $timeout) {

        const utils = {

            /**
             * @name app.utils#observe
             * @param {object} target
             * @param {string|string[]} keys
             * @param {Object} [options]
             * @param {Function} [options.set]
             * @param {Function} [options.get]
             * @return {Signal}
             */
            observe(target, keys, options) {
                return _addObserverSignals(target, keys, options);
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
             * @name app.utils#onFetch
             * @param {Response} response
             * @return {Promise}
             */
            onFetch(response) {
                if (response.ok) {
                    if (response.headers.get('Content-Type') === 'application/json') {
                        return response.json();
                    } else {
                        return response.text();
                    }
                } else {
                    return response.text()
                        .then((error) => {
                            try {
                                return Promise.reject(JSON.parse(error));
                            } catch (e) {
                                return Promise.reject(error);
                            }
                        });
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
                    keys = Object.keys(target)
                        .filter((name) => typeof target[name] === 'function');
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
             * @param {string|number|BigNumber} num
             * @param {number} precision
             * @return {string}
             */
            getNiceNumber(num, precision) {
                switch (typeof num) {
                    case 'string':
                    case 'number':
                        return new BigNumber(num, 10).toFormat(precision);
                    case 'object':
                        if (num != null) {
                            return num.toFormat(precision);
                        }
                    default:
                        throw new Error('Wrong format!');
                }
            },

            /**
             * @name app.utils#parseNiceNumber
             * @param data
             * @return {BigNumber}
             */
            parseNiceNumber(data) {
                return new BigNumber((String(data)
                    .replace(',', '')
                    .replace(/\s/g, '') || 0), 10);
            },

            /**
             * @name app.utils#toArray
             * @param {*} some
             * @return {[*]}
             */
            toArray(some) {
                return Array.isArray(some) ? some : [some];
            },

            /**
             * @name app.utils#toHash
             * @param {array} list
             * @param {string} key
             * @return {*}
             */
            toHash(list, key) {
                return list.reduce((result, item) => {
                    result[tsUtils.get(item, key)] = item;
                    return result;
                }, Object.create(null));
            },

            /**
             * @name app.utils#comparators
             */
            comparators: {
                asc: function (a, b) {
                    return a > b ? 1 : a === b ? 0 : -1;
                },
                desc: function (a, b) {
                    return a > b ? -1 : a === b ? 0 : 1;
                },
                process(processor) {
                    return {
                        asc: (a, b) => utils.comparators.asc(processor(a), processor(b)),
                        desc: (a, b) => utils.comparators.desc(processor(a), processor(b))
                    };
                }
            }
        };

        function _getObserver(target) {
            if (!target.__) {
                const observer = Object.create(null);
                Object.defineProperty(target, '__', {
                    writable: false,
                    configurable: false,
                    enumerable: false,
                    value: observer
                });
            }
            return target.__;
        }

        function _getSignal(observer, keys) {
            if (Array.isArray(keys)) {
                const event = keys.sort(utils.comparators.asc)
                    .join(',');

                if (!observer.__events) {
                    observer.__events = Object.create(null);
                }

                if (!observer.__events[event]) {
                    observer.__events[event] = new tsUtils.Signal();
                    let canDispatch = true;
                    keys.forEach((key) => {
                        observer[key].signal.on(() => {
                            if (canDispatch) {
                                observer.__events[event].dispatch();
                                canDispatch = false;
                                setTimeout(() => {
                                    canDispatch = true;
                                }, 50);
                            }
                        });
                    });
                }

                return observer.__events[event];
            } else {
                return observer[keys].signal;
            }
        }

        function _addObserverSignals(target, keys, options) {
            const observer = _getObserver(target);
            options = options || Object.create(null);

            utils.toArray(keys)
                .forEach((key) => {
                    if (observer[key]) {
                        return null;
                    }

                    const item = Object.create(null);
                    item.signal = new tsUtils.Signal();
                    item.timer = null;
                    item.value = target[key];
                    observer[key] = item;

                    Object.defineProperty(target, key, {
                        enumerable: true,
                        get: () => observer[key].value,
                        set: (value) => {
                            value = options.set ? options.set(value) : value;
                            const prev = observer[key].value;
                            if (prev !== value) {
                                observer[key].value = value;
                                if (!observer[key].timer) {
                                    observer[key].timer = $timeout(() => {
                                        observer[key].timer = null;
                                        observer[key].signal.dispatch({ value, prev });
                                    }, 0);
                                }
                            }
                        }
                    });
                });

            return _getSignal(observer, keys);
        }

        return utils;
    };

    factory.$inject = ['$q', 'Moment', '$timeout'];

    angular.module('app.utils')
        .factory('utils', factory);
})();

