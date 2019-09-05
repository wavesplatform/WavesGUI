/* eslint-disable no-console */
(function () {
    'use strict';

    const { isEmpty, getPaths, get, Signal } = require('ts-utils');
    const tsApiValidator = require('ts-api-validator');
    const { splitEvery, pipe, path, map, ifElse, concat, defaultTo, identity, isNil, propEq } = require('ramda');
    const { WindowAdapter, Bus } = require('@waves/waves-browser-bus');
    const { libs } = require('@waves/waves-transactions');
    const { base58Decode, base58Encode, stringToBytes, bytesToString } = libs.crypto;
    const ds = require('data-service');
    const { SIGN_TYPE } = require('@waves/signature-adapter');
    const { Money } = require('@waves/data-entities');
    const { STATUS_LIST } = require('@waves/oracle-data');
    const { BigNumber } = require('@waves/bignumber');

    const GOOD_COLORS_LIST = [
        '#39a12c',
        '#6a737b',
        '#e49616',
        '#008ca7',
        '#ff5b38',
        '#ff6a00',
        '#c74124',
        '#00a78e',
        '#b01e53',
        '#e0c61b',
        '#5a81ea',
        '#72b7d2',
        '#a5b5c3',
        '#81c926',
        '#86a3bd',
        '#c1d82f',
        '#5c84a8',
        '#267e1b',
        '#fbb034',
        '#ff846a',
        '#47c1ff',
        '#00a0af',
        '#85d7c6',
        '#8a7967',
        '#26c1c9',
        '#72d28b',
        '#5B1909',
        '#264764',
        '#270774',
        '#8763DE',
        '#F04085',
        '#1E6AFD',
        '#FF1E43',
        '#D3002D',
        '#967400',
        '#264163'
    ];

    const DEFAULT_ASSET_ICONS_MAP = Object.assign(Object.create(null), {
        [WavesApp.defaultAssets.WAVES]: '/img/assets/waves.svg',
        [WavesApp.defaultAssets.BTC]: '/img/assets/bitcoin.svg',
        [WavesApp.defaultAssets.ETH]: '/img/assets/ethereum.svg',
        [WavesApp.defaultAssets.LTC]: '/img/assets/ltc.svg',
        [WavesApp.defaultAssets.ZEC]: '/img/assets/zec.svg',
        [WavesApp.defaultAssets.EUR]: '/img/assets/euro.svg',
        [WavesApp.defaultAssets.USD]: '/img/assets/usd.svg',
        [WavesApp.defaultAssets.DASH]: '/img/assets/dash.svg',
        [WavesApp.defaultAssets.BCH]: '/img/assets/bitcoin-cash.svg',
        [WavesApp.defaultAssets.BSV]: '/img/assets/bitcoin-cash-sv.svg',
        [WavesApp.defaultAssets.TRY]: '/img/assets/try.svg',
        [WavesApp.defaultAssets.XMR]: '/img/assets/xmr.svg',
        [WavesApp.defaultAssets.VST]: '/img/assets/vostok.svg',
        [WavesApp.defaultAssets.ERGO]: '/img/assets/ergo.svg',
        [WavesApp.defaultAssets.BNT]: '/img/assets/bnt.svg',
        [WavesApp.otherAssetsWithIcons.EFYT]: '/img/assets/efyt.svg',
        [WavesApp.otherAssetsWithIcons.WNET]: '/img/assets/wnet.svg'
    });

    const nullOrCb = (name, cb) => (val1, val2) => {
        const v1 = val1[name];
        const v2 = val2[name];
        return v1 === v2 && v1 == null ? null : cb(v1, v2);
    };

    const valOrNullOpen = (v1, v2) => v1 == null ? v2 : v1;
    const valOrNullClose = (v1, v2) => valOrNullOpen(v2, v1);
    const maxOrNull = name => nullOrCb(name, (v1, v2) => Math.max(v1 || 0, v2 || 0));
    const minOrNull = name => nullOrCb(name, (v1, v2) => {
        if (v1 == null) {
            return v2;
        }

        return v2 == null ? v1 : Math.min(v1, v2);
    });
    const nullOrSum = name => nullOrCb(name, (v1, v2) => {
        if (v1 == null) {
            return v2;
        }

        return v2 == null ? v1 : v1 + v2;
    });

    const joinCandles = ([c1, c2 = c1]) => ({
        txsCount: c1.txsCount + c2.txsCount,
        high: maxOrNull('high')(c1, c2),
        low: minOrNull('low')(c1, c2),
        close: nullOrCb('close', valOrNullClose)(c1, c2),
        open: nullOrCb('open', valOrNullOpen)(c1, c2),
        volume: nullOrSum('volume')(c1, c2),
        time: c1.time
    });

    const MAX_RESOLUTION = 1440;
    const INTERVAL_PRESETS = {
        '1m': 1000 * 60,
        '5m': 1000 * 60 * 5,
        '15m': 1000 * 60 * 15,
        '30m': 1000 * 60 * 30,
        '1h': 1000 * 60 * 60,
        '3h': 1000 * 60 * 60 * 3,
        '6h': 1000 * 60 * 60 * 6,
        '12h': 1000 * 60 * 60 * 12,
        '1d': 1000 * 60 * 60 * 24
    };
    const INTERVAL_MAP = {
        1: {
            interval: INTERVAL_PRESETS['1m'],
            intervalName: '1m',
            converter: el => el
        },
        5: {
            interval: INTERVAL_PRESETS['5m'],
            intervalName: '5m',
            converter: el => el
        },
        15: {
            interval: INTERVAL_PRESETS['15m'],
            intervalName: '15m',
            converter: el => el
        },
        30: {
            interval: INTERVAL_PRESETS['30m'],
            intervalName: '30m',
            converter: el => el
        },
        60: {
            interval: INTERVAL_PRESETS['1h'],
            intervalName: '1h',
            converter: el => el
        },
        120: {
            interval: INTERVAL_PRESETS['1h'],
            intervalName: '1h',
            converter: (candles) => splitEvery(2, candles).map(joinCandles)
        },
        180: {
            interval: INTERVAL_PRESETS['3h'],
            intervalName: '3h',
            converter: el => el
        },
        240: {
            interval: INTERVAL_PRESETS['1h'],
            intervalName: '1h',
            converter: pipe(splitEvery(2), map(joinCandles), splitEvery(2), map(joinCandles))
        },
        360: {
            interval: INTERVAL_PRESETS['6h'],
            intervalName: '6h',
            converter: el => el
        },
        720: {
            interval: INTERVAL_PRESETS['12h'],
            intervalName: '12h',
            converter: el => el
        },
        1440: {
            interval: INTERVAL_PRESETS['1d'],
            intervalName: '1d',
            converter: el => el
        }
    };
    const IMPORT_PRIORITY_MAP = {
        seed: 0,
        key: 0,
        wavesKeeper: 1,
        ledger: 2
    };

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
        const base58ToBytes = base58Decode;
        const bytesToBase58 = base58Encode;

        const utils = {

            /**
             * @name app.utils#apiValidatorParts
             */
            apiValidatorParts: {
                BigNumberPart
            },
            /**
             * @name app.utils#getAssetLogo
             * @param {string} assetId
             * @return {string | undefined}
             */
            getAssetLogo(assetId) {
                return DEFAULT_ASSET_ICONS_MAP[assetId];
            },
            /**
             * @name app.utils#getAssetLogoBackground
             * @param assetId
             * @return {string}
             */
            getAssetLogoBackground(assetId) {
                const sum = assetId.split('')
                    .map(char => char.charCodeAt(0))
                    .reduce((acc, code) => acc + code, 0);
                return GOOD_COLORS_LIST[sum % GOOD_COLORS_LIST.length];
            },
            /**
             * @return {{ledger: number, seed: number, wavesKeeper: number}}
             */
            getImportPriorityMap() {
                return IMPORT_PRIORITY_MAP;
            },
            /**
             * @name app.utils#base58ToBytes
             * @function
             * @param {string} data
             * @return {Uint8Array}
             */
            base58ToBytes: pipe(
                defaultTo(''),
                base58ToBytes
            ),
            /**
             * @name app.utils#base58ToString
             * @function
             * @param {string|number} data
             * @return {string}
             */
            base58ToString: pipe(
                defaultTo(''),
                base58ToBytes,
                bytesToString
            ),
            /**
             * @name app.utils#stringToBytes
             * @function
             * @param {string|number} data
             * @return {Uint8Array}
             */
            stringToBytes: pipe(
                defaultTo(''),
                stringToBytes
            ),
            /**
             * @name app.utils#stringToBase58
             * @function
             * @param {string|number} data
             * @return {string}
             */
            stringToBase58: pipe(
                defaultTo(''),
                String,
                stringToBytes,
                bytesToBase58
            ),
            /**
             * @name app.utils#bytesToBase58
             * @function
             * @param {Uint8Array} data
             * @return {string}
             */
            bytesToBase58: pipe(
                defaultTo(new Uint8Array([])),
                bytesToBase58
            ),
            /**
             * @name app.utils#bytesToString
             * @function(data: Uint8Array): string
             */
            bytesToString: pipe(
                defaultTo(new Uint8Array([])),
                bytesToString
            ),
            /**
             * @name app.utils#bytesToSafeString
             * @function(data: Uint8Array): string
             */
            bytesToSafeString: ifElse(
                pipe(
                    identity,
                    bytesToString,
                    isNil
                ),
                pipe(
                    identity,
                    bytesToBase58,
                    concat('base58:')
                ),
                pipe(
                    identity,
                    bytesToString
                )
            ),

            /**
             * @name app.utils#removeUrlProtocol
             * @param {string} url
             * @return {string}
             */
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
                            return encodeURIComponent(v);
                    }
                };
                const createKeyValue = (key, v) => `${key}=${customSerialize(v)}`;
                const createArrayKeyValue = (key, values) => values.map(v => createKeyValue(`${key}[]`, v)).join('&');
                const qs = Object.entries(obj)
                    .filter(([_, value]) => value !== undefined)
                    .map(([key, value]) => Array.isArray(value) ? createArrayKeyValue(key, value) : createKeyValue(key, value))
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
                    .map(base58Encode);
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
             * @name app.utils#timeoutPromise
             * @param {Promise} promise
             * @param {number} timeout
             */
            timeoutPromise(promise, timeout) {
                let timer;
                const timeoutPromise = new Promise((_, reject) => {
                    timer = setTimeout(() => {
                        reject(new Error('Timeout error!'));
                    }, timeout);
                });
                promise.finally(() => {
                    clearTimeout(timer);
                });
                return Promise.race([promise, timeoutPromise]);
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
                    const from = { x: 0, y: 0 };
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
             * @name app.utils#safeApply
             * @param {$rootScope.Scope} $scope
             */
            safeApply($scope) {
                const phase = $scope.$root && $scope.$root.$$phase;

                if (phase !== '$apply' && phase !== '$digest') {
                    $scope.$apply();
                }
            },

            /**
             * @name app.utils#safeApply
             * @param {$rootScope.Scope} $scope
             */
            postDigest($scope) {
                return new Promise(resolve => {
                    $scope.$parent.$$postDigest(resolve);
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
                return data && data.then && typeof data.then === 'function';
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

                if (a instanceof Money && b instanceof Money) {
                    return a.asset.id === b.asset.id && a.eq(b);
                }

                if (a instanceof BigNumber && b instanceof BigNumber) {
                    return a.eq(b);
                }

                const pathsA = getPaths(a);
                const pathsB = getPaths(b);

                return pathsA.length === pathsB.length && pathsA.every((path, index) => {
                    return get(a, path) === get(b, path) && (String(path) === String(pathsB[index]));
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
                    WindowAdapter.createSimpleWindowAdapter(win, {
                        origins: [origin]
                    }).then(adapter => {
                        const bus = new Bus(adapter);

                        bus.once('ready', () => {
                            bus.request('getLocalStorageData', null, timeout)
                                .then(utils.onExportUsers(origin, resolve))
                                .catch(reject);
                        });

                        bus.request('getLocalStorageData', null, timeout)
                            .then(utils.onExportUsers(origin, resolve))
                            .catch(reject);

                    });
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
                    .then(() => utils.importUsersByWindow(iframe, origin, timeout))
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

                const win = window.open(
                    `${origin}/export.html`,
                    'export',
                    `${width},${height},${left},${top},${right},no,no,no,no,no,no`
                );

                const close = d => {
                    if (!closed) {
                        win.close();
                        closed = true;
                    }
                    return d;
                };

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
                        resolve([]);
                    }

                    resolve(response);
                };
            },

            /**
             * @name app.utils#openDex
             * @param {string} dex
             * @param {string} asset1
             * @param {string} [asset2]
             */
            openDex(asset1, asset2, dex = 'dex') {
                /**
                 * @type {$state}
                 */
                const $state = $injector.get('$state');
                if (asset1 && asset2) {
                    if (asset1 === asset2) {
                        return utils.openDex(asset1);
                    }
                    setTimeout(() => {
                        $state.go(`main.${dex}`, { assetId1: asset1, assetId2: asset2 });
                    }, 50);
                    return null;
                }
                if (asset1 === WavesApp.defaultAssets.WAVES) {
                    asset2 = WavesApp.defaultAssets.BTC;
                } else {
                    asset2 = WavesApp.defaultAssets.WAVES;
                }
                setTimeout(() => {
                    $state.go(`main.${dex}`, { assetId1: asset1, assetId2: asset2 });
                }, 50);
            },


            /**
             * @name app.utils#getValidCandleOptions
             * @param {number|Date} from
             * @param {number|Date} to
             * @param {number} interval
             * @return {Array.<Object>}
             */
            getValidCandleOptions(from, to, interval = 60) {
                const minute = 1000 * 60;

                from = Math.floor(from / minute) * minute;
                to = Math.ceil(to / minute) * minute;

                const config = INTERVAL_MAP[interval];
                const options = {
                    timeStart: from instanceof Date ? from.getTime() : from,
                    timeEnd: to instanceof Date ? to.getTime() : to,
                    interval
                };

                if (options.timeEnd - options.timeStart < config.interval) {
                    options.timeStart = options.timeEnd - config.interval;
                }

                const intervals = [];
                const newInterval = {
                    timeStart: options.timeStart,
                    interval: config.intervalName
                };

                while (newInterval.timeStart <= options.timeEnd) {
                    newInterval.timeEnd = Math.min(
                        options.timeEnd,
                        newInterval.timeStart + config.interval * MAX_RESOLUTION
                    );

                    intervals.push({ ...newInterval });
                    newInterval.timeStart = newInterval.timeEnd + config.interval;
                }

                return {
                    options: intervals,
                    config
                };
            },


            /**
             * @name app.utils#getMaxInterval
             * @param {number} from
             * @param {number} to
             * @param {number} amount
             * @return {number}
             */
            getMaxInterval(from, to, amount = 100) {
                const delta = to - from;
                const findDif = interval => Math.abs((delta / interval) - amount);
                const intObj = Object.values(INTERVAL_MAP)
                    .reduce((prev, cur) => (findDif(cur.interval) < findDif(prev.interval) ? cur : prev));
                return Object.keys(INTERVAL_MAP).find(key => INTERVAL_MAP[key].interval === intObj.interval);
            },


            /**
             * @name app.utils#getNiceNumberTemplate
             * @param {BigNumber|string|number} num
             * @param {number} precision
             * @param {boolean | number} [shortMode]
             * @return {string}
             */
            getNiceNumberTemplate(num, precision, shortMode) {
                const bigNum = this.parseNiceNumber(num);
                const formatted = this.getNiceNumber(bigNum, precision);

                const isShortMode = typeof shortMode === 'number' ? true : shortMode;
                const minValue = typeof shortMode === 'number' ? shortMode : 10000;

                if (isShortMode && bigNum.gte(minValue)) {
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
             * @name app.utils#getDataFromOracles
             * @param {string} assetId
             * @return {object}
             */
            getDataFromOracles(assetId) {
                /**
                 * @type {User}
                 */
                const user = $injector.get('user');

                const dataOracle = ds.dataManager.getOraclesAssetData(assetId);

                const isGateway = path(['status'], dataOracle) === 3;

                const isTokenomica = path(['status'], dataOracle) === STATUS_LIST.VERIFIED &&
                    path(['provider'], dataOracle) === 'Tokenomica';

                const isVerified = path(['status'], dataOracle) === STATUS_LIST.VERIFIED &&
                    path(['provider'], dataOracle) !== 'Tokenomica';

                const isSuspicious = user.scam[assetId];

                const isGatewaySoon = path(['status'], dataOracle) === 4;

                const hasLabel = isVerified || isGateway || isSuspicious || isTokenomica || isGatewaySoon;

                const ticker = path(['ticker'], dataOracle);
                const link = path(['link'], dataOracle);
                const email = path(['email'], dataOracle);
                const logo = path(['logo'], dataOracle);
                const provider = isVerified || isTokenomica && path(['provider'], dataOracle) || null;
                const description = path(['description', 'en'], dataOracle);

                return {
                    isVerified,
                    isGateway,
                    isTokenomica,
                    isSuspicious,
                    isGatewaySoon,
                    hasLabel,
                    ticker,
                    link,
                    email,
                    provider,
                    description,
                    logo
                };
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
                    result[get(item, key)] = item;
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
                const change = new Signal();

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
                    .add(data.bids[0].price)
                    .div(2);
                const delta = spreadPrice.mul(data.chartCropRate).div(2);
                const max = spreadPrice.add(delta);
                const min = BigNumber.max(0, spreadPrice.sub(delta));

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
             * @name app.utils#getEventInfo
             * @param {object} event
             * @return {object}
             */
            getEventInfo(event) {
                let newEvent;
                if ('changedTouches' in event.originalEvent) {
                    newEvent = {
                        ...event,
                        pageX: event.changedTouches[0].pageX,
                        pageY: event.changedTouches[0].pageY,
                        screenX: event.changedTouches[0].screenX,
                        screenY: event.changedTouches[0].screenY,
                        clientX: event.changedTouches[0].clientX,
                        clientY: event.changedTouches[0].clientY
                    };
                } else {
                    newEvent = {
                        ...event,
                        pageX: event.pageX,
                        pageY: event.pageY,
                        screenX: event.screenX,
                        screenY: event.screenY,
                        clientX: event.clientX,
                        clientY: event.clientY
                    };
                }
                return newEvent;
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
                        return 1;
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
                        return -1;
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
                        if (a instanceof Money && b instanceof Money) {
                            return utils.comparators.money.asc(a, b);
                        } else if (a instanceof BigNumber && b instanceof BigNumber) {
                            return utils.comparators.bigNumber.asc(a, b);
                        }

                        return utils.comparators.asc(a, b);
                    },
                    desc: function (a, b) {
                        if (a instanceof Money && b instanceof Money) {
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
             * @name app.utils#getExchangeTotalPrice
             * @oaram {Money} amount
             * @param {Money} price
             * @return string
             */
            getExchangeTotalPrice(amount, price) {
                const amountTokens = amount.getTokens();
                const priceTokens = price.getTokens();
                const precision = price.asset.precision;
                return amountTokens.mul(priceTokens).toFormat(precision);
            },

            /**
             * @name app.utils#getExchangeFee
             * @param {IExchange} tx
             * @return Money
             */
            getExchangeFee(tx) {
                const isBuy = tx.exchangeType === WavesApp.TRANSACTION_TYPES.EXTENDED.EXCHANGE_BUY;
                return isBuy ? tx.buyMatcherFee : tx.sellMatcherFee;
            },

            /**
             * @name app.utils#getTransactionTypeName
             * @param tx
             * @return string
             */
            getTransactionTypeName(tx) {
                const TYPES = WavesApp.TRANSACTION_TYPES.EXTENDED;
                const SPONSOR_START = TYPES.SPONSORSHIP_START;
                const SPONSOR_STOP = TYPES.SPONSORSHIP_STOP;

                switch (tx.type) {
                    case SIGN_TYPE.TRANSFER:
                        return _getTransferType(tx);
                    case SIGN_TYPE.MASS_TRANSFER:
                        return utils.isMyPublicKey(tx.senderPublicKey) ? TYPES.MASS_SEND : TYPES.MASS_RECEIVE;
                    case SIGN_TYPE.EXCHANGE:
                        return utils.typOfExchange(tx);
                    case SIGN_TYPE.LEASE:
                        return utils.isMyPublicKey(tx.senderPublicKey) ? TYPES.LEASE_OUT : TYPES.LEASE_IN;
                    case SIGN_TYPE.CANCEL_LEASING:
                        return TYPES.CANCEL_LEASING;
                    case SIGN_TYPE.CREATE_ALIAS:
                        return TYPES.CREATE_ALIAS;
                    case SIGN_TYPE.ISSUE:
                        return TYPES.ISSUE;
                    case SIGN_TYPE.REISSUE:
                        return TYPES.REISSUE;
                    case SIGN_TYPE.BURN:
                        return TYPES.BURN;
                    case SIGN_TYPE.DATA:
                        return _getDataType(tx);
                    case SIGN_TYPE.SET_SCRIPT:
                        return (tx.script || '').replace('base64:', '') ? TYPES.SET_SCRIPT : TYPES.SCRIPT_CANCEL;
                    case SIGN_TYPE.SPONSORSHIP:
                        return tx.minSponsoredAssetFee.getCoins().gt(0) ? SPONSOR_START : SPONSOR_STOP;
                    case SIGN_TYPE.SET_ASSET_SCRIPT:
                        return TYPES.SET_ASSET_SCRIPT;
                    case SIGN_TYPE.SCRIPT_INVOCATION:
                        return TYPES.SCRIPT_INVOCATION;
                    default:
                        return TYPES.UNKNOWN;
                }
            },

            /**
             * @name app.utils#typOfExchange
             * @param tx
             * @return string
             */
            typOfExchange({ exchangeType }) {
                const TYPES = WavesApp.TRANSACTION_TYPES.EXTENDED;
                return exchangeType === 'buy' ? TYPES.EXCHANGE_BUY : TYPES.EXCHANGE_SELL;
            },

            /**
             * @name app.utils#isMyPublicKey
             * @param publicKey
             * @return {boolean}
             */
            isMyPublicKey(publicKey) {
                /**
                 * @type {User}
                 */
                const user = $injector.get('user');
                return !publicKey || user.publicKey === publicKey;
            },

            /**
             * @name app.utils#isMyAddressOrAlias
             * @param {string} addressOrAlias
             * @return boolean
             */
            isMyAddressOrAlias(addressOrAlias) {
                /**
                 * @type {User}
                 */
                const user = $injector.get('user');
                const aliasList = ds.dataManager.getLastAliases();

                return addressOrAlias === user.address || aliasList.includes(addressOrAlias);
            },


            /**
             * @name app.utils#isNotEqualValue
             * @param {*} oldValue
             * @param {*} newValue
             */
            isNotEqualValue: isNotEqualValue,

            /**
             * @name app.utils#checkIsScriptError
             * @param {number} error
             * @return {boolean}
             */
            checkIsScriptError(error) {
                // eslint-disable-next-line no-bitwise
                return (error >> 8 & 0xFFF) === 7;
            },

            /**
             * @name app.utils#createOrder
             * @param {app.utils.IOrderData} data
             * @return {Promise}
             */
            createOrder(data) {
                const timestamp = ds.utils.normalizeTime(Date.now());
                /**
                 * @type {INotification}
                 */
                const notification = $injector.get('notification');
                /**
                 * @type {ModalManager}
                 */
                const modalManager = $injector.get('modalManager');
                /**
                 * @type {User}
                 */
                const user = $injector.get('user');
                /**
                 * @type {boolean}
                 */
                const isAdvancedMode = user.getSetting('advancedMode');

                const hasCustomFee = data.matcherFee.asset.id && data.matcherFee.asset.id !== 'WAVES';

                /**
                 * @type {number | undefined}
                 */
                const version = (hasCustomFee && 3) || 2;

                const signableData = {
                    type: SIGN_TYPE.CREATE_ORDER,
                    data: { ...data, version, timestamp }
                };

                const onError = data => {
                    if (data && data.error && data.isScriptError) {
                        notification.error({
                            ns: 'app.dex',
                            title: {
                                literal: 'directives.createOrder.notifications.error.title'
                            },
                            body: {
                                literal: `directives.createOrder.notifications.error.${data.error}`,
                                params: data.params ? data.params : {}
                            }
                        }, -1);
                    } else {
                        notification.error({
                            ns: 'app.dex',
                            title: {
                                literal: 'directives.createOrder.notifications.error.title'
                            },
                            body: {
                                literal: data && data.message || data
                            }
                        }, -1);
                    }


                    return Promise.reject(data);
                };

                return utils.createSignable(signableData)
                    .then(signable => {
                        return utils.signMatcher(signable)
                            .then(signable => signable.getDataForApi())
                            .then(ds.createOrder)
                            .catch(data => {
                                const isScriptError = this.checkIsScriptError(data.error);

                                if (!isAdvancedMode || !isScriptError) {
                                    return Promise.reject({ ...data, isScriptError });
                                }

                                return modalManager.showConfirmTx(signable, false)
                                    .then(ds.createOrder, () => null);
                            });
                    })
                    .catch(onError);

            },

            /**
             * @name app.utils#createSignable
             * @param {*} data
             * @return {Promise<Signable>}
             */
            createSignable(data) {
                try {
                    return Promise.resolve(ds.signature.getSignatureApi().makeSignable(data));
                } catch (e) {
                    return Promise.reject(e);
                }
            },

            /**
             * @name app.utils#signUserOrders
             * @param {{[matcherSign]: {[timestamp]: number, [timestamp]: number}}} data
             * @return {Promise<{signature: string, timestamp: number}>}
             */
            signUserOrders(data) {
                try {
                    const dayForwardTime = ds.app.getTimeStamp(1, 'day');
                    const lastSignedTs = path(['matcherSign', 'timestamp'], data);
                    const isNeedSign = !lastSignedTs || lastSignedTs - dayForwardTime < 0;

                    if (!isNeedSign) {
                        return Promise.resolve(data.matcherSign);
                    }

                    const timestamp = ds.app.getTimeStamp(
                        WavesApp.matcherSignInterval.count,
                        WavesApp.matcherSignInterval.timeType
                    );

                    const signable = ds.signature.getSignatureApi().makeSignable({
                        type: SIGN_TYPE.MATCHER_ORDERS,
                        data: { timestamp }
                    });

                    return utils.signMatcher(signable)
                        .then(signable => signable.getSignature())
                        .then(signature => ({ signature, timestamp }));
                } catch (e) {
                    return Promise.reject(e);
                }
            },

            /**
             * @param {String} name
             * @return {Promise<boolean>}
             */
            assetNameWarning(name) {
                /**
                 * @type {User}
                 */
                const user = $injector.get('user');
                name = (name || '').toLowerCase().trim();

                if (!name) {
                    return Promise.resolve(false);
                }

                if (name && Object.keys(user.tokensName).some(item => name === item.toLowerCase())) {
                    return Promise.resolve(true);
                }

                const api = user.getSetting('api') || WavesApp.network.api;

                return ds.fetch(`${api}/v0/assets?search=${encodeURIComponent(name)}`)
                    .then(({ data }) => data.some(
                        ({ data }) => (
                            (data.name || '').toLowerCase() === name ||
                            (data.ticker || '').toLowerCase() === name
                        ))
                    )
                    .catch(() => false);
            },

            /**
             * @name app.utils#sign
             * @param {Signable} signable
             * @return {Promise<Signable>}
             */
            signMatcher(signable) {
                /**
                 * @type {User}
                 */
                const user = $injector.get('user');
                /**
                 * @type {ModalManager}
                 */
                const modalManager = $injector.get('modalManager');

                if (user.userType === 'seed' || user.userType === 'privateKey') {
                    return signable.addMyProof()
                        .then(() => signable);
                }

                const errorParams = { error: 'sign-error', userType: user.userType };

                const signByDeviceLoop = () => modalManager.showSignByDevice(signable)
                    .catch(() => modalManager.showSignDeviceError(errorParams)
                        .then(signByDeviceLoop))
                    .catch(() => Promise.reject({ message: 'Your sign is not confirmed!' }));

                return signByDeviceLoop();
            },

            /**
             * @name app.utils#isLockedInDex
             * @param assetId1
             * @param assetId2
             * @return {boolean}
             */
            isLockedInDex(assetId1, assetId2 = null) {
                const configService = $injector.get('configService');

                const lockedAssetsIndDex = configService.get('SETTINGS.DEX.LOCKED_PAIRS') || [];

                return lockedAssetsIndDex.includes(assetId1) || lockedAssetsIndDex.includes(assetId2);
            }
        };

        /**
         * @param {api.ITransferTransaction<string>} tx
         * @private
         */
        function _getTransferType(tx) {
            const meIsSender = isEmpty(tx.senderPublicKey) || utils.isMyPublicKey(tx.senderPublicKey);
            const meIsRecipient = utils.isMyAddressOrAlias(tx.recipient);
            const TYPES = WavesApp.TRANSACTION_TYPES.EXTENDED;

            if (!meIsSender && !meIsRecipient) {
                return TYPES.SPONSORSHIP_FEE;
            } else if (meIsSender && meIsRecipient) {
                return TYPES.CIRCULAR;
            } else {
                return meIsSender ? TYPES.SEND : TYPES.RECEIVE;
            }
        }

        /**
         * @param {api.ITransferTransaction<string>} tx
         * @private
         */
        function _getDataType(tx) {
            const { DATA, DATA_VOTE } = WavesApp.TRANSACTION_TYPES.EXTENDED;
            const data = Array.isArray(tx.data) ? tx.data : tx.data.data;
            const keyRating = data.find(propEq('key', 'tokenRating'));

            return keyRating && keyRating.value === 'tokenRating' ? DATA_VOTE : DATA;
        }

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
                    observer.__events[event] = new Signal();
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
                if (oldValue instanceof Money && newValue instanceof Money) {
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
                    item.signal = new Signal();
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

/**
 * @typedef {object} app.utils#IOrderData
 * @property {string} orderType
 * @property {Money} price
 * @property {Money} amount
 * @property {Money} matcherFee
 * @property {string} matcherPublicKey
 * @property {number} expiration
 */

