/* eslint-disable no-console */
/* global BigNumber */
(function () {
    'use strict';

    const tsUtils = require('ts-utils');
    const tsApiValidator = require('ts-api-validator');
    const { WindowAdapter, Bus } = require('@waves/waves-browser-bus');
    const { splitEvery, pipe } = require('ramda');
    const { libs } = require('@waves/signature-generator');

    class BigNumberPart extends tsApiValidator.BasePart {

        getValue(data) {
            switch (typeof data) {
                case 'string':
                case 'number':
                    return new BigNumber(data);
                default:
                    return null;
            }
        }

    }

    const dataEntities = require('@waves/data-entities');

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
             * @name app.utils#apiValidatorParts
             */
            apiValidatorParts: {
                BigNumberPart
            },

            removeUrlProtocol(url) {
                return url.replace(/.+?(:\/\/)/, '');
            },

            /**
             * @name app.utils#getUrlForRoute
             * @param {string} [url]
             * @return string
             */
            getUrlForRoute(url) {
                url = decodeURI(url || location.href);

                const getHash = url => {
                    if (url.includes('#')) {
                        return url.slice(url.indexOf('#')).replace('#', '/');
                    } else {
                        return '';
                    }
                };

                const processor = pipe(
                    utils.removeUrlProtocol,
                    getHash
                );

                return processor(url);
            },

            /**
             * @name app.utils#getRouterParams
             * @param {string} url
             * @return object
             */
            getRouterParams(url) {
                /**
                 * @type {typeof Router}
                 */
                const Router = $injector.get('Router');
                const router = new Router();

                const makeRouterHandler = name => (params = Object.create(null), search = Object.create(null)) => {
                    const url = Router.ROUTES[name];
                    return { name, url, data: { ...params, ...search } };
                };

                Object.keys(Router.ROUTES).forEach(name => {
                    const handler = makeRouterHandler(name);
                    router.registerRoute(Router.ROUTES[name], handler);
                });

                return router.apply(url);
            },

            /**
             * @name app.utils#createQS
             * @param {object} obj
             * @return {string}
             */
            createQS(obj) {
                /* eslint-disable */
                const customSerialize = v => {
                    switch (true) {
                        case v instanceof Date:
                            return v.getTime();
                        default:
                            return v;
                    }
                };
                const createKeyValue = (key, v) => `${key}=${customSerialize(v)}`;
                const createArrayKeyValue = (key, values) => values.map(v => createKeyValue(`${key}[]`, v)).join('&');
                const qs = Object.entries(obj)
                    .filter(([_, value]) => value !== undefined)
                    .map(([key, value]) => {
                        return Array.isArray(value) ? createArrayKeyValue(key, value) : createKeyValue(key, value);
                    })
                    .join('&');
                return qs === '' ? qs : `?${qs}`;
                /* eslint-enable */
            },

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
             * @name app.utils#getPublicKeysFromScript
             * @param {string} script
             * @return {Array<string>}
             */
            getPublicKeysFromScript(script) {
                const toBytes = key => splitEvery(2, key)
                    .map(byte16 => parseInt(byte16, 16));

                return (script.match(/ByteVector\(\d+\sbytes,\s(.[^)]+)/g) || [])
                    .map(res => res.replace(/ByteVector\(\d+\sbytes,\s0x/, ''))
                    .map(toBytes)
                    .map(libs.base58.encode);
            },

            /**
             * @name app.utils#debounce
             * @param {function} callback
             * @param {number} [timeout]
             * @return {Function}
             */
            debounce(callback, timeout) {
                const control = {
                    queued: false,
                    args: null
                };
                return function (...args) {
                    control.args = args;
                    if (!control.queued) {
                        setTimeout(() => {
                            control.queued = false;
                            callback.call(this, ...control.args);
                        }, timeout);
                    }
                    control.queued = true;
                };
            },

            /**
             * @name app.utils#parseElectronUrl
             * @param {string} url
             * @return {{path: string, search: string, hash: string}}
             */
            parseElectronUrl(url) {
                const [pathAndSearch, hash] = url.split('#');
                const [path, search] = pathAndSearch.split('?');

                return {
                    path,
                    search: `?${search || ''}`,
                    hash: `#${hash || ''}`
                };
            },

            /**
             * @name app.utils#redirect
             * @param {string} url
             */
            redirect(url) {
                if (WavesApp.isDesktop()) {
                    window.openInBrowser(url);
                } else {
                    location.href = url;
                }
            },

            /**
             * @name app.utils#parseSearchParams
             * @param {string} search
             * @return {object}
             */
            parseSearchParams(search = '') {
                const hashes = search.slice(search.indexOf('?') + 1).split('&').filter(Boolean);
                const params = Object.create(null);

                const normalizeValue = value => {
                    if (value === 'null') {
                        return null;
                    }
                    const num = Number(value);
                    return String(num) === value ? num : value;
                };

                const add = (name, value) => {
                    if (value == null) {
                        params[name] = true;
                    } else {
                        params[name] = normalizeValue(decodeURIComponent(value));
                    }
                };

                const addArray = (name, value) => {
                    const key = name.replace('[]', '');
                    if (!params[key]) {
                        params[key] = [];
                    }
                    params[key].push(normalizeValue(decodeURIComponent(value)));
                };

                hashes.forEach((hash) => {
                    const [key, val] = hash.split('=');
                    if (key.includes('[]')) {
                        addArray(key, val);
                    } else {
                        add(key, val);
                    }
                });

                return params;
            },

            /**
             * @name app.utils#debounceRequestAnimationFrame
             * @param callback
             * @return {function(...[*])}
             */
            debounceRequestAnimationFrame(callback) {
                const control = {
                    queued: false,
                    args: null
                };
                return function (...args) {
                    control.args = args;
                    if (!control.queued) {
                        requestAnimationFrame(() => {
                            control.queued = false;
                            callback.call(this, ...control.args);
                        });
                    }
                    control.queued = true;
                };
            },

            /**
             * @name app.utils#animate
             * @param {JQuery} $element
             * @param properties
             * @param options
             * @return {Promise}
             */
            animate($element, properties, options) {
                return new Promise((resolve) => {
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
                if (this.isPromise(data)) {
                    return data;
                } else {
                    return Promise.resolve(data);
                }
            },

            /**
             * @name app.utils#isPromise
             * @param {object|Promise} data
             * @return {boolean}
             */
            isPromise(data) {
                return data.then && typeof data.then === 'function';
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
             * @name app.utils#getMoneyWithoutFee
             * @param {Money} money
             * @param {Money} fee
             * @return {Money}
             */
            getMoneyWithoutFee(money, fee) {
                if (fee && money.asset.id === fee.asset.id) {
                    return money.sub(fee);
                } else {
                    return money;
                }
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
                return new Promise((resolve) => {
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
                return new Promise((resolve, reject) => {
                    const img = new Image();
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
                        return new BigNumber(num, 10).toFormat(precision && Number(precision));
                    case 'object':
                        if (num != null) {
                            return num.toFormat(precision && Number(precision));
                        }
                        throw new Error('Wrong format!');
                    default:
                        throw new Error('Wrong format!');
                }
            },

            /**
             * @name app.utils#parseNiceNumber
             * @param {*} data
             * @return {BigNumber}
             */
            parseNiceNumber(data) {
                if (data instanceof BigNumber) {
                    return data;
                }
                const num = new BigNumber((String(data)
                    .replace(',', '')
                    .replace(/\s/g, '') || 0), 10);

                return num.isNaN() ? new BigNumber(0) : num;
            },

            /**
             * @name app.utils#loadOrTimeout
             * @param {Window} target
             * @param {number} timeout
             * @return {Promise<any>}
             */
            loadOrTimeout(target, timeout) {
                return new Promise((resolve, reject) => {
                    target.addEventListener('load', resolve, false);
                    target.addEventListener('error', reject, false);

                    setTimeout(() => {
                        reject(new Error('Timeout limit error!'));
                    }, timeout);
                });
            },

            /**
             * @name app.utils#importUsersByWindow
             * @param {Window} win
             * @param {string} origin
             * @param {number} timeout
             * @return {Promise<any>}
             */
            importUsersByWindow(win, origin, timeout) {
                return new Promise((resolve, reject) => {
                    const adapter = new WindowAdapter(
                        { win: window, origin: WavesApp.origin },
                        { win, origin }
                    );
                    const bus = new Bus(adapter);

                    bus.once('export-ready', () => {
                        bus.request('getLocalStorageData')
                            .then(utils.onExportUsers(origin, resolve));
                    });

                    setTimeout(() => {
                        reject(new Error('Timeout limit error!'));
                    }, timeout);
                });
            },

            /**
             * @name app.utils#importAccountByIframe
             * @param {string} origin
             * @param {number} timeout
             * @return {Promise<T>}
             */
            importAccountByIframe(origin, timeout) {

                /**
                 * @type {HTMLIFrameElement}
                 */
                const iframe = document.createElement('iframe');
                const remove = () => {
                    if (iframe.parentNode) {
                        document.body.removeChild(iframe);
                    }
                };
                const onError = (error) => {
                    remove();
                    return Promise.reject(error);
                };
                const onSuccess = (data) => {
                    remove();
                    return Promise.resolve(data);
                };

                iframe.src = `${origin}/export.html`;

                const result = utils.loadOrTimeout(iframe, timeout)
                    .then(() => utils.importUsersByWindow(iframe.contentWindow, origin, timeout))
                    .then(onSuccess)
                    .catch(onError);

                iframe.style.opacity = '0';
                iframe.style.position = 'absolute';
                iframe.style.left = '0';
                iframe.style.top = '0';
                document.body.appendChild(iframe);

                return result;
            },

            /**
             * @name app.utils#importAccountByTab
             * @param {string} origin
             * @param {number} timeout
             * @return {Promise<T>}
             */
            importAccountByTab(origin, timeout) {
                const width = 'width=100';
                const height = 'height=100';
                const left = `left=${Math.floor(screen.width - 100 / 2)}`;
                const right = `top=${Math.floor(screen.height - 100 / 2)}`;
                let closed = false;

                const close = d => {
                    if (!closed) {
                        win.close();
                        closed = true;
                    }
                    return d;
                };

                const win = window.open(
                    `${origin}/export.html`,
                    'export',
                    `${width},${height},${left},${top},${right},no,no,no,no,no,no`
                );

                const onError = (e) => {
                    close();
                    return Promise.reject(e);
                };

                return utils.importUsersByWindow(win, origin, timeout)
                    .then(close)
                    .catch(onError);
            },

            /**
             * @name app.utils#onExportUsers
             * @param origin
             * @param resolve
             * @returns {Function}
             */
            onExportUsers(origin, resolve) {
                return (response) => {
                    if (!response) {
                        return [];
                    }

                    resolve(response.accounts && response.accounts.map(utils.remapOldClientAccounts) || []);
                };
            },

            /**
             * @name app.utils#openDex
             * @param {string} asset1
             * @param {string} [asset2]
             */
            openDex(asset1, asset2) {
                /**
                 * @type {$state}
                 */
                const $state = $injector.get('$state');
                if (asset1 && asset2) {
                    if (asset1 === asset2) {
                        return utils.openDex(asset1);
                    }
                    setTimeout(() => {
                        $state.go('main.dex', { assetId1: asset1, assetId2: asset2 });
                    }, 50);
                    return null;
                }
                if (asset1 === WavesApp.defaultAssets.WAVES) {
                    asset2 = WavesApp.defaultAssets.BTC;
                } else {
                    asset2 = WavesApp.defaultAssets.WAVES;
                }
                setTimeout(() => {
                    $state.go('main.dex', { assetId1: asset1, assetId2: asset2 });
                }, 50);
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
                const formatted = this.getNiceNumber(bigNum, precision);

                if (shortMode && bigNum.gte(10000)) {
                    return this.getNiceBigNumberTemplate(bigNum);
                } else {
                    const separatorDecimal = WavesApp.getLocaleData().separators.decimal;
                    const [int, decimal] = formatted.split(separatorDecimal);
                    if (decimal) {
                        const decimalTpl = _processDecimal(decimal, separatorDecimal);
                        return (
                            `<span class="int">${int}</span>` +
                            `<span class="decimal">${decimalTpl}</span>`
                        );
                    } else {
                        return `<span class="int">${int}</span>`;
                    }
                }
            },

            /**
             * @param bigNum
             * @returns {string}
             */
            getNiceBigNumberTemplate: function (bigNum) {
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
             * @name app.utils#groupMoney
             * @param {Money[]} moneyList
             * @return {object}
             */
            groupMoney(moneyList) {
                return moneyList.filter(Boolean).reduce((result, money) => {
                    if (result[money.asset.id]) {
                        result[money.asset.id] = result[money.asset.id].add(money);
                    } else {
                        result[money.asset.id] = money;
                    }
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
             * @name app.utils#parseAngularParam
             * @param {string} attribute
             * @param $scope
             * @param {Signal} destroy
             * @return {{attribute: string, exp: string, change: Signal, value: *}}
             */
            parseAngularParam(attribute, $scope, destroy) {
                const exp = _hasExp(attribute) && attribute;
                const change = new tsUtils.Signal();

                const result = utils.liteObject({
                    attribute, exp, change, value: null
                });

                if (exp) {
                    if (exp.indexOf('::') !== -1) {
                        result.value = $scope.$eval(exp.replace('::', '').replace(/{{(.*)?(}})/, '$1'));
                    } else {
                        const stop = $scope.$watch(exp, (value) => {
                            result.value = value;
                            change.dispatch(value);
                        });
                        destroy.once(() => {
                            stop();
                        });
                    }
                } else {
                    result.value = attribute;
                }

                return result;
            },

            /**
             * @name app.utils#liteObject
             * @param {T} props
             * @return {T}
             */
            liteObject(props) {
                const result = Object.create(null);
                Object.assign(result, props);
                return result;
            },

            /**
             * @name app.utils#filterOrderBookByCharCropRate
             * @param {object} data
             * @param {number} data.chartCropRate
             * @param {Array<{price: string}>} data.asks
             * @param {Array<{price: string}>} data.bids
             * @return {{bids: Array, asks: Array}}
             */
            filterOrderBookByCharCropRate(data) {
                const { min, max } = this.getOrderBookRangeByCropRate(data);

                if (!min || !max) {
                    return {
                        bids: [],
                        asks: []
                    };
                }

                return {
                    asks: data.asks.filter((ask) => new BigNumber(ask.price).lte(max)),
                    bids: data.bids.filter((bid) => new BigNumber(bid.price).gte(min))
                };
            },

            /**
             * @name app.utils#cache
             * @param {Object} storage
             * @param {function} fetch
             * @param {function} toId
             * @param {number} time
             * @param {function} fromList
             */
            cache: (storage, fetch, toId, time, fromList) => (data) => {
                const list = utils.toArray(data);
                const toRequest = [];
                const promiseList = [];

                list.forEach((item) => {
                    const id = toId(item);
                    if (storage[id]) {
                        promiseList.push(storage[id].then(fromList(item)));
                    } else {
                        toRequest.push(item);
                    }
                });

                let promise;
                if (toRequest.length) {
                    promise = fetch(toRequest);
                    toRequest.forEach((item) => {
                        const id = toId(item);
                        storage[id] = promise;
                        setTimeout(() => {
                            delete storage[id];
                        }, time);
                    });
                } else {
                    return Promise.all(promiseList);
                }

                return Promise.all([promise, ...promiseList])
                    .then((...list) => list.reduce((acc, i) => acc.concat(...i), []));
            },

            /**
             * @name app.utils#filterOrderBookByCharCropRate
             * @param {object} data
             * @param {number} data.chartCropRate
             * @param {Array<{price: string}>} data.asks
             * @param {Array<{price: string}>} data.bids
             * @return {{min: BigNumber, max: BigNumber}}
             */
            getOrderBookRangeByCropRate(data) {
                if (!data.asks || !data.asks.length || !data.bids || !data.bids.length) {
                    return {
                        min: null,
                        max: null
                    };
                }

                const spreadPrice = new BigNumber(data.asks[0].price)
                    .plus(data.bids[0].price)
                    .div(2);
                const delta = spreadPrice.times(data.chartCropRate).div(2);
                const max = spreadPrice.plus(delta);
                const min = BigNumber.max(0, spreadPrice.minus(delta));

                return { min, max };
            },

            /**
             * @name app.utils#chainCall
             * @param {function[]} functionList
             * @return {Promise<void>}
             */
            chainCall(functionList) {
                return new Promise((resolve, reject) => {
                    const callList = functionList.slice().reverse();

                    const apply = () => {
                        if (callList.length) {
                            const func = callList.pop();
                            const result = func();
                            if (result && result.then && typeof result.then === 'function') {
                                result.then(apply, reject);
                            } else {
                                apply();
                            }
                        } else {
                            resolve();
                        }
                    };

                    apply();
                });
            },

            /**
             * @name app.utils#comparators
             */
            comparators: {
                asc: function (a, b) {
                    if (a == null) {
                        if (b == null) {
                            return 0;
                        } else {
                            return -1;
                        }
                    } else if (b == null) {
                        if (a == null) {
                            return 0;
                        } else {
                            return 1;
                        }
                    }

                    if (a > b) {
                        return 1;
                    }

                    if (a === b) {
                        return 0;
                    }

                    return -1;
                },
                desc: function (a, b) {
                    if (a == null) {
                        if (b == null) {
                            return 0;
                        } else {
                            return 1;
                        }
                    } else if (b == null) {
                        if (a == null) {
                            return 0;
                        } else {
                            return -1;
                        }
                    }

                    if (a > b) {
                        return -1;
                    }

                    if (a === b) {
                        return 0;
                    }

                    return 1;
                },
                bigNumber: {
                    asc: function (a, b) {
                        if (a.gt(b)) {
                            return 1;
                        }

                        if (a.eq(b)) {
                            return 0;
                        }

                        return -1;
                    },
                    desc: function (a, b) {
                        if (a.gt(b)) {
                            return -1;
                        }

                        if (a.eq(b)) {
                            return 0;
                        }

                        return 1;
                    }
                },
                money: {
                    asc: function (a, b) {
                        return utils.comparators.bigNumber.asc(a.getTokens(), b.getTokens());
                    },
                    desc: function (a, b) {
                        return utils.comparators.bigNumber.desc(a.getTokens(), b.getTokens());
                    }
                },
                smart: {
                    asc: function (a, b) {
                        if (a instanceof ds.wavesDataEntities.Money && b instanceof ds.wavesDataEntities.Money) {
                            return utils.comparators.money.asc(a, b);
                        } else if (a instanceof BigNumber && b instanceof BigNumber) {
                            return utils.comparators.bigNumber.asc(a, b);
                        }

                        return utils.comparators.asc(a, b);
                    },
                    desc: function (a, b) {
                        if (a instanceof ds.wavesDataEntities.Money && b instanceof ds.wavesDataEntities.Money) {
                            return utils.comparators.money.desc(a, b);
                        } else if (a instanceof BigNumber && b instanceof BigNumber) {
                            return utils.comparators.bigNumber.desc(a, b);
                        }

                        return utils.comparators.desc(a, b);
                    }
                },
                process(processor) {
                    return {
                        asc: (a, b) => utils.comparators.asc(processor(a), processor(b)),
                        desc: (a, b) => utils.comparators.desc(processor(a), processor(b)),
                        bigNumber: {
                            asc: (a, b) => utils.comparators.bigNumber.asc(processor(a), processor(b)),
                            desc: (a, b) => utils.comparators.bigNumber.desc(processor(a), processor(b))
                        },
                        money: {
                            asc: (a, b) => utils.comparators.money.asc(processor(a), processor(b)),
                            desc: (a, b) => utils.comparators.money.desc(processor(a), processor(b))
                        },
                        smart: {
                            asc: (a, b) => utils.comparators.smart.asc(processor(a), processor(b)),
                            desc: (a, b) => utils.comparators.smart.desc(processor(a), processor(b))
                        }
                    };
                }
            },

            /**
             * @name app.utils#remapOldClientAccounts
             * @param account
             * @returns {{address: *, encryptedSeed: *, settings: {encryptionRounds: number}}}
             */
            remapOldClientAccounts(account) {
                return {
                    name: account.name,
                    address: account.address,
                    encryptedSeed: account.cipher,
                    settings: {
                        encryptionRounds: 1000
                    }
                };
            },

            /**
             * @name app.utils#isNotEqualValue
             * @param {*} oldValue
             * @param {*} newValue
             */
            isNotEqualValue: isNotEqualValue,

            /**
             * @name app.utils#parseError
             * @param error
             * @returns {*}
             */
            parseError(error) {
                try {
                    return typeof error === 'string' ? JSON.parse(error).message : error;
                } catch (e) {
                    return error;
                }
            }
        };

        /**
         * @param value
         * @return {boolean}
         * @private
         */
        function _hasExp(value) {
            if (!value) {
                return false;
            }

            const openIndex = value.indexOf('{{');
            const closeIndex = value.indexOf('}}');
            return openIndex !== -1 && closeIndex !== -1 && openIndex < closeIndex;
        }

        /**
         * @param {string} decimal
         * @param {string} separator
         * @return {string}
         * @private
         */
        function _processDecimal(decimal, separator) {
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
            if (end) {
                return `${separator}${decimal.substr(0, end)}<span class="decimal-muted">${mute.join('')}</span>`;
            }
            return `<span class="decimal-muted">${separator}${mute.join('')}</span>`;
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
                if (oldValue instanceof dataEntities.Money && newValue instanceof dataEntities.Money) {
                    return oldValue.asset.id !== newValue.asset.id || oldValue.toTokens() !== newValue.toTokens();
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

        function _getOriginalDescriptor(target, key) {
            const descriptor = Object.getOwnPropertyDescriptor(target, key);

            if (descriptor) {
                return descriptor;
            }

            if (target.constructor && target.constructor !== Object.constructor && target.constructor.prototype) {
                return Object.getOwnPropertyDescriptor(target.constructor.prototype, key);
            }
            return null;
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

                    const originalDescriptor = _getOriginalDescriptor(target, key);
                    observer[key] = item;

                    if (originalDescriptor && originalDescriptor.get) {

                        const descriptor = {
                            enumerable: originalDescriptor.enumerable,
                            get: originalDescriptor.get
                        };

                        if (originalDescriptor.set) {
                            descriptor.set = (value) => {
                                const prev = originalDescriptor.get.call(target);
                                if (isNotEqualValue(prev, value)) {
                                    originalDescriptor.set.call(target, value);
                                    observer[key].signal.dispatch({ value, prev });
                                }
                            };
                        } else {
                            descriptor.set = () => {
                                throw new Error('Original descriptor has\'t set property!');
                            };
                        }

                        Object.defineProperty(target, key, descriptor);
                    } else {
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
                    }
                });

            return _getSignal(observer, keys);
        }

        return utils;
    };

    factory.$inject = ['$q', 'Moment', '$injector'];

    angular.module('app.utils')
        .factory('utils', factory);
})();

