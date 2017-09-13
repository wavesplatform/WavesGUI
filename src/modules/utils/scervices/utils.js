(function () {
    'use strict';

    const factory = function ($q, $timeout) {

        class Moment {

            constructor(date) {
                /**
                 * @type {Date}
                 * @private
                 */
                this._date = date;

                this.add = {
                    /**
                     * @param {number} count
                     * @return {Moment}
                     */
                    second: (count) => {
                        const [y, m, d, h, mm, s, ms] = this._getParts();
                        this._date = new Date(y, m, d, h, mm, s + count, ms);
                        return this;
                    },
                    /**
                     * @param {number} count
                     * @return {Moment}
                     */
                    minute: (count) => {
                        const [y, m, d, h, mm, s, ms] = this._getParts();
                        this._date = new Date(y, m, d, h, mm + count, s, ms);
                        return this;
                    },
                    /**
                     * @param {number} count
                     * @return {Moment}
                     */
                    hour: (count) => {
                        const [y, m, d, h, mm, s, ms] = this._getParts();
                        this._date = new Date(y, m, d, h + count, mm, s, ms);
                        return this;
                    },
                    /**
                     * @param {number} count
                     * @return {Moment}
                     */
                    day: (count) => {
                        const [y, m, d, h, mm, s, ms] = this._getParts();
                        this._date = new Date(y, m, d + count, h, mm, s, ms);
                        return this;
                    },
                    /**
                     * @param {number} count
                     * @return {Moment}
                     */
                    month: (count) => {
                        const [y, m, d, h, mm, s, ms] = this._getParts();
                        this._date = new Date(y, m + count, d, h, mm, s, ms);
                        return this;
                    },
                    /**
                     * @param {number} count
                     * @return {Moment}
                     */
                    year: (count) => {
                        const [y, m, d, h, mm, s, ms] = this._getParts();
                        this._date = new Date(y + count, m, d, h, mm, s, ms);
                        return this;
                    }
                };
            }

            /**
             * @param {string} pattern
             * @returns {string}
             */
            format(pattern) {
                return tsUtils.date(pattern)(this.date);
            }

            /**
             * @return {Moment}
             */
            clone() {
                return new Moment(this._date);
            }

            /**
             * @return {number}
             */
            valueOf() {
                return this._date.valueOf();
            }

            /**
             * @return {string}
             */
            toString() {
                return this._date.toString();
            }

            /**
             * @return {Date}
             */
            getDate() {
                return this._date;
            }

            _getParts() {
                return [
                    this._date.getFullYear(),
                    this._date.getMonth(),
                    this._date.getDate(),
                    this._date.getHours(),
                    this._date.getMinutes(),
                    this._date.getSeconds(),
                    this._date.getMilliseconds()
                ];
            }

        }

        class Base {

            /**
             * @param {string[]|string} keys
             * @param callback
             */
            observe(keys, callback) {
                if (!this._timersHash) {
                    this._timersHash = Object.create(null);
                }
                keys = Array.isArray(keys) ? keys : [keys];
                const event = keys.join(' ');
                keys.forEach((key) => {
                    if (!this._props) {
                        this._props = Object.create(null);
                    }
                    this._props[key] = this[key];
                    Object.defineProperty(this, key, {
                        get: () => this._props[key],
                        set: (value) => {
                            if (value !== this._props[key]) {
                                this._props[key] = value;
                                if (!this._timersHash[event]) {
                                    this._timersHash[event] = $timeout(() => {
                                        callback();
                                        delete this._timersHash[event];
                                    }, 0);
                                }
                            }
                        }
                    });
                });
            }

        }

        return {

            /**
             * @param {*} data
             * @return {Promise}
             */
            when(data) {
                if (data.then && typeof data.then === 'function') {
                    const defer = $q.defer();
                    data.then(defer.resolve, defer.reject);
                    return defer.promise;
                } else {
                    return $q.when(data);
                }
            },

            Base,

            /**
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
             * @param {Date | number} [date]
             * @return {Moment}
             */
            moment(date) {
                return new Moment(date && new Date(date) || new Date());
            },

            /**
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
            }
        };
    };

    factory.$inject = ['$q', '$timeout'];

    angular.module('app.utils')
        .factory('utils', factory);
})();
