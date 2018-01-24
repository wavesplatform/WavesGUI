(function () {
    'use strict';

    /**
     * @name app.utils
     */

    /**
     * @param {$q} $q
     * @param {Moment} Moment
     * @param {$injector} $injector
     * @return {app.utils}
     */
    const factory = function ($q, Moment, $injector) {

        const utils = {

            /**
             * @name app.utils#observe
             * @param {object} target
             * @param {string|string[]} keys
             * @param {object} [options]
             * @param {Function} [options.set]
             * @param {Function} [options.get]
             * @return {Signal}
             */
            observe(target, keys, options) {
                return _addObserverSignals(target, keys, options);
            },

            /**
             * @name app.utils#animate
             * @param {JQuery} $element
             * @param properties
             * @param options
             * @return {Promise}
             */
            animate($element, properties, options) {
                return $q((resolve) => {
                    options = options || Object.create(null);
                    if (options.complete) {
                        const origin = options.complete;
                        options.complete = function () {
                            resolve();
                            origin();
                        };
                    } else {
                        options.complete = resolve;
                    }
                    $element.stop(true, true)
                        .animate(properties, options);
                });
            },

            /**
             * // TODO dosent work!
             * @deprecated
             * @name app.utils#animateTransform
             * @param {JQuery} $element
             * @param {{x: number, y:number}} to
             * @return {Promise}
             */
            animateTransform($element, to) {
                const prefixis = ['', '-ms-', '-moz-', '-o-', '-webkit-'];
                return $q((resolve) => {
                    const transform = $element.css('transform');
                    const from = transform === 'none' ? { x: 0, y: 0 } : { x: 0, y: 0 };
                    $element.stop(true, true).animate({}, {
                        progress: function (tween, progress) {
                            const x = (to.x - from.x) * progress + from.x;
                            const y = (to.y - from.y) * progress + from.y;
                            prefixis.forEach((prefix) => {
                                $element.css(`${prefix}transform`, `translate(${x}px, ${y}px)`);
                            });
                        },
                        complete: resolve,
                        duration: 300
                    });
                });
            },

            /**
             * @name app.utils#animateByClass
             * @param {JQuery} $element
             * @param {string} className
             * @param {boolean} state
             * @param {string} [stopProperty]
             * @return {Promise}
             */
            animateByClass($element, className, state, stopProperty) {
                return $q((resolve) => {

                    const element = $element.get(0);
                    const eventList = [
                        'transitionend',
                        'oTransitionEnd',
                        'otransitionend',
                        'webkitTransitionEnd'
                    ];

                    if (element.classList.contains(className) === state) {
                        resolve();
                        return null;
                    }

                    const handler = (e) => {
                        if (e.currentTarget === element && (!stopProperty || e.propertyName === stopProperty)) {
                            resolve();
                            eventList.forEach((eventName) => {
                                element.removeEventListener(eventName, handler, false);
                            });
                        }
                    };
                    eventList.forEach((eventName) => {
                        element.addEventListener(eventName, handler, false);
                    });

                    $element.toggleClass(className, state);
                });
            },

            /**
             * @name app.utils#when
             * @param {*} [data]
             * @return {Promise}
             */
            when(data) {
                if (data && data.then && typeof data.then === 'function') {
                    const defer = $q.defer();
                    data.then(defer.resolve, defer.reject)
                        .catch((e) => console.error(e));
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
                    if (response.headers.get('Content-Type').indexOf('application/json') !== -1) {
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
             * @param {Date | number | string | Moment} [date]
             * @param {string} [pattern]
             * @return {Moment}
             */
            moment(date, pattern) {
                if (date instanceof Moment) {
                    return date.clone(pattern);
                }
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
                        throw new Error('Wrong format!');
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
             * @name app.utils#getNiceNumberTemplate
             * @param {BigNumber|string|number} num
             * @param {number} precision
             * @param {boolean} [shortMode]
             * @return {string}
             */
            getNiceNumberTemplate(num, precision, shortMode) {
                const bigNum = this.parseNiceNumber(num);
                const formatted = this.getNiceNumber(num, precision);

                if (shortMode && bigNum.gte(10000)) {
                    /**
                     * @type {app.i18n}
                     */
                    const i18n = $injector.get('i18n');
                    let stringNum;
                    let postfix;

                    if (bigNum.gte(1000000)) {
                        stringNum = bigNum.div(1000000).toFormat(1);
                        postfix = i18n.translate('number.short.million');
                    } else {
                        stringNum = bigNum.div(1000).toFormat(1);
                        postfix = i18n.translate('number.short.thousand');
                    }

                    return `${stringNum}${postfix}`;
                } else {
                    const separatorDecimal = WavesApp.getLocaleData().separators.decimal;
                    const [int, decimal] = formatted.split(separatorDecimal);
                    if (decimal) {
                        const decimalTpl = _processDecimal(decimal);
                        return `<span class="int">${int}${separatorDecimal}</span><span class="decimal">${decimalTpl}</span>`;
                    } else {
                        return `<span class="int">${int}</span>`;
                    }
                }
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
             * @param {Array} list
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
             * @name app.utils#wait
             * @param {number} [time]
             * @return {Promise}
             */
            wait(time) {
                return $q((resolve) => {
                    if (!time) {
                        requestAnimationFrame(resolve);
                    } else {
                        setTimeout(resolve, time);
                    }
                });
            },

            /**
             * @name app.utils#addUniqueToArray
             * @param {Array} list
             * @param {Array} array
             */
            addUniqueToArray(list, array) {
                list.forEach((item) => {
                    if (array.indexOf(item) === -1) {
                        array.push(item);
                    }
                });
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
                bigNumber: {
                    asc: function (a, b) {
                        return a.gt(b) ? 1 : a.eq(b) ? 0 : -1;
                    },
                    desc: function (a, b) {
                        return a.gt(b) ? -1 : a.eq(b) ? 0 : 1;
                    }
                },
                process(processor) {
                    return {
                        asc: (a, b) => utils.comparators.asc(processor(a), processor(b)),
                        desc: (a, b) => utils.comparators.desc(processor(a), processor(b)),
                        bigNumber: {
                            asc: (a, b) => utils.comparators.bigNumber.asc(processor(a), processor(b)),
                            desc: (a, b) => utils.comparators.bigNumber.desc(processor(a), processor(b))
                        }
                    };
                }
            }
        };

        function _processDecimal(decimal) {
            const mute = [];
            decimal.split('')
                .reverse()
                .some((char) => {
                    if (char === '0') {
                        mute.push(0);
                        return false;
                    }
                    return true;
                });
            const end = decimal.length - mute.length;
            return `${decimal.substr(0, end)}<span class="decimal-muted">${mute.join('')}</span>`;
        }

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
                    keys.forEach((key) => {
                        observer[key].signal.on(() => {
                            observer.__events[event].dispatch();
                        });
                    });
                }

                return observer.__events[event];
            } else {
                return observer[keys].signal;
            }
        }

        function isNotEqualValue(oldValue, newValue) {
            if (typeof oldValue === typeof newValue) {
                if (oldValue instanceof Waves.Money && newValue instanceof Waves.Money) {
                    return oldValue.toTokens() !== newValue.toTokens();
                } else if (oldValue instanceof BigNumber && newValue instanceof BigNumber) {
                    return !oldValue.eq(newValue);
                } else if (Array.isArray(oldValue) && Array.isArray(newValue)) {
                    return oldValue.length !== newValue.length ||
                        oldValue.some((item, i) => isNotEqualValue(item, newValue[i]));
                } else {
                    return oldValue !== newValue;
                }
            } else {
                return true;
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
                            if (isNotEqualValue(prev, value)) {
                                observer[key].value = value;
                                observer[key].signal.dispatch({ value, prev });
                            }
                        }
                    });
                });

            return _getSignal(observer, keys);
        }

        return utils;
    };

    factory.$inject = ['$q', 'Moment', '$injector'];

    angular.module('app.utils')
        .factory('utils', factory);
})();

