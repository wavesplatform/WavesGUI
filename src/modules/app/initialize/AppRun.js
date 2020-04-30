/* eslint-disable no-console */
/* global openInBrowser */
(function () {
    'use strict';

    // const onContentLoad = new Promise((resolve) => {
    //     document.addEventListener('DOMContentLoaded', resolve);
    // });
    const { libs } = require('@waves/waves-transactions');
    const { base64Encode, blake2b, stringToBytes } = libs.crypto;

    const locationHref = location.href;
    const i18next = require('i18next');
    const ds = require('data-service');
    const { propEq, where, gte, lte, equals, __ } = require('ramda');

    const i18nextReady = new Promise(resolve => {
        const handler = data => {
            resolve(data);
            i18next.off('initialized', handler);
        };
        i18next.on('initialized', handler);
    });

    const PROGRESS_MAP = {
        RUN_SCRIPT: 10,
        APP_RUN: 15,
        LOCALIZE_READY: 25,
        IMAGES_LOADED: 50
    };

    const allProgress = Object.values(PROGRESS_MAP)
        .reduce((result, item) => result + item, 0);
    if (allProgress !== 100) {
        throw new Error('Configure preloader progress!');
    }

    const LOADER = {
        _current: 0,
        _root: document.querySelector('.app-preloader'),
        _element: document.querySelector('.app-preloader .progress'),
        addProgress(delta) {
            this._current += delta;
            this._current = Math.min(this._current, 100);
            this._element.style.width = `${this._current}%`;
            WavesApp.progress = this._current;
        },
        stop() {
            return new Promise(resolve => {
                const loader = $(this._root);
                loader.fadeOut(1000, () => {
                    loader.remove();
                    resolve();
                });
            });
        }
    };

    LOADER.addProgress(PROGRESS_MAP.RUN_SCRIPT);
    WavesApp.state = 'initApp';

    /**
     * @param {$rootScope.Scope} $rootScope
     * @param {User} user
     * @param {app.utils} utils
     * @param $state
     * @param $transitions
     * @param {State} state
     * @param {ModalManager} modalManager
     * @param {Storage} storage
     * @param {INotification} notification
     * @param {app.utils.decorators} decorators
     * @param {MultiAccount} multiAccount
     * @param {ConfigService} configService
     * @param {INotification} userNotification
     * @return {AppRun}
     */
    // eslint-disable-next-line max-params
    const run = function (
        $rootScope,
        utils,
        user,
        $state,
        $transitions,
        state,
        modalManager,
        storage,
        notification,
        decorators,
        multiAccount,
        configService,
        userNotification
    ) {

        const phone = WavesApp.device.phone();
        const tablet = WavesApp.device.tablet();
        const analytics = require('@waves/event-sender');

        const isPhone = !!phone;
        const isTablet = !!tablet;
        const isDesktop = !(isPhone || isTablet);
        const isWeb = WavesApp.isWeb();

        $rootScope.isDesktop = isDesktop;
        $rootScope.isNotDesktop = !isDesktop;
        $rootScope.isPhone = isPhone;
        $rootScope.isNotPhone = !isPhone;
        $rootScope.isTablet = isTablet;

        if (isPhone) {
            document.body.classList.add('phone');
        } else if (isTablet) {
            document.body.classList.add('tablet');
        } else if (isWeb) {
            document.body.classList.add('web');
        } else {
            document.body.classList.add('desktop');
        }

        class AppRun {

            /**
             * @type {boolean}
             * @private
             */
            _unavailable = false;

            constructor() {
                const identityImg = require('identity-img');

                LOADER.addProgress(PROGRESS_MAP.APP_RUN);

                /**
                 * List of css class on body (from current state)
                 * @type {Array<string>}
                 */
                this.activeClasses = [];

                /**
                 * Configure library generation avatar by address
                 */
                identityImg.config({ rows: 8, cells: 8 });
                this._stopLoader();
                this._setHandlers();
                this._initializeLogin();
                this._initializeOutLinks();

                if (WavesApp.isDesktop()) {
                    window.listenMainProcessEvent((type, url) => {
                        const parts = utils.parseElectronUrl(url);
                        const path = parts.path.replace(/\/$/, '') || parts.path;

                        if (path) {
                            const noLogin = path === '/' || WavesApp.stateTree.where({ noLogin: true })
                                .some(item => {
                                    const url = item.get('url') || item.id;
                                    return path === url;
                                });

                            if (noLogin) {
                                location.hash = `#!${path}${parts.search}`;
                            } else {
                                user.onLogin().then(() => {
                                    setTimeout(() => {
                                        location.hash = `#!${path}${parts.search}`;
                                    }, 1000);
                                });
                            }
                        }
                    });
                }

                $rootScope.WavesApp = WavesApp;
            }

            static getLoadImagePromise(length) {
                return function (path) {
                    return new Promise(resolve => {
                        const img = new Image();
                        const apply = () => {
                            LOADER.addProgress(PROGRESS_MAP.IMAGES_LOADED / length);
                            resolve();
                        };

                        img.onload = apply;
                        img.onerror = () => {
                            console.warn(`Can't load image! "${path}"`);
                            apply();
                        };
                        img.src = path;
                    });
                };
            }

            static _getUrlFromState(state) {
                return (
                    WavesApp
                        .stateTree
                        .getPath(state.name.split('.').slice(-1)[0])
                        .filter((id) => !WavesApp.stateTree.find(id).get('abstract'))
                        .map((id) => WavesApp.stateTree.find(id).get('url') || id)
                        .reduce((url, id) => `${url}/${id}`, '')
                );
            }

            _initTryDesktop() {
                if (multiAccount.isSignedIn || !isDesktop || WavesApp.isDesktop()) {
                    return Promise.resolve(true);
                }

                const url = new URL(locationHref);
                const href = `waves://${url.pathname}${url.search}${url.hash}`.replace('///', '//');

                return storage.load('openClientMode').then(clientMode => {
                    switch (clientMode) {
                        case 'desktop':
                            window.open(href);
                            return this._runDesktop();
                        case 'web':
                            return Promise.resolve(true);
                        default:
                            return Promise.resolve(true);
                    }
                });
            }

            _runDesktop() {
                this._canOpenDesktopPage = true;
                $state.go('desktop');

                return false;
            }

            /**
             * @private
             */
            _setHandlers() {
                $transitions.onSuccess({}, transition => {
                    this._onChangeStateSuccess(transition);
                });
                configService.change.on(this._updateServiceAvailable, this);
            }

            /**
             * @param {string} [path]
             * @private
             */
            _updateServiceAvailable(path) {
                if (path !== 'SERVICE_TEMPORARILY_UNAVAILABLE') {
                    return null;
                }
                const unavailable = configService.get('SERVICE_TEMPORARILY_UNAVAILABLE');

                if (unavailable === this._unavailable) {
                    return null;
                }

                this._unavailable = unavailable;
                ds.dataManager.setSilentMode(unavailable);

                if (unavailable && !user.address) {
                    $state.go('unavailable');
                } else {
                    // TODO Fix State Tree
                    user.logout('welcome');
                }
            }

            /**
             * Initialize handler for out links for electron
             * @private
             */
            _initializeOutLinks() {
                if (WavesApp.isDesktop()) {
                    $(document).on('click', '[target="_blank"]', (e) => {
                        const $link = $(e.currentTarget);
                        e.preventDefault();
                        openInBrowser($link.attr('href'));
                    });
                }
            }

            /**
             * @private
             */
            _updateUserNotifications() {
                const notifications = configService.get('NOTIFICATIONS') || [];
                const time = ds.utils.normalizeTime(Date.now());

                const closed = user.getSetting('closedNotification')
                    .filter(id => notifications.some(propEq('id', id)));
                user.setSetting('closedNotification', closed);

                const notificationsWithDate = notifications
                    .map(item => ({
                        ...item,
                        start_date: new Date(item.start_date),
                        end_date: new Date(item.end_date)
                    }));

                notificationsWithDate
                    .filter(where({
                        start_date: lte(__, time),
                        end_date: gte(__, time),
                        id: id => !(userNotification.has(id) || closed.includes(id))
                    }))
                    .forEach(item => {
                        const method = ['warn', 'success', 'error', 'info'].find(equals(item.type)) || 'warn';
                        const literal = `user-notification.${item.id}`;

                        Object.entries(item.text).forEach(([lang, message]) => {
                            i18next.addResource(lang, 'app', literal, message);
                        });

                        userNotification[method]({
                            ...item,
                            body: {
                                literal: literal
                            }
                        }).then(() => {
                            user.setSetting('closedNotification', [
                                item.id,
                                ...user.getSetting('closedNotification')
                            ]);
                        });
                    });

                notificationsWithDate.filter(where({ end_date: lte(__, time) }))
                    .forEach(item => userNotification.remove(item.id));
            }

            /**
             * @private
             */
            _listenChangeLanguage() {
                i18next.on('languageChanged', this._changeLangHandler);
            }

            /**
             * @private
             */
            _stopListenChangeLanguage() {
                i18next.off('languageChanged', this._changeLangHandler);
            }

            /**
             * @private
             */
            _changeLangHandler() {
                localStorage.setItem('lng', i18next.language);
            }

            /**
             * @private
             */
            _initializeLogin() {
                this._listenChangeLanguage();

                analytics.init(WavesApp.analyticsIframe, {
                    platform: WavesApp.type,
                    networkByte: ds.config.get('code'),
                    userType: 'unknown'
                });

                analytics.activate();

                this._onInitialTransitions();

                user.logoutSignal.on(() => {
                    notification.destroyAll();
                    userNotification.removeAll();
                    clearInterval(this._notifyTimer);
                });

                user.loginSignal.on(() => {
                    analytics.addDefaultParams({ auuid: base64Encode(blake2b(stringToBytes(user.address))) });
                    userNotification.destroyAll();
                    i18nextReady.then(() => {
                        this._updateUserNotifications();
                        clearInterval(this._notifyTimer);
                        this._notifyTimer = setInterval(() => this._updateUserNotifications(), 10000);
                    });
                });
            }

            _onInitialTransitions() {
                let waiting = false;
                const START_STATES = WavesApp.stateTree.where({ noLogin: true })
                    .map((item) => WavesApp.stateTree.getPath(item.id).join('.'));

                const DEXW_LOCKED_STATES = [
                    'welcome',
                    'desktopUpdate',
                    'switch'
                ];

                const offInitialTransitions = $transitions.onStart({}, transition => {

                    const toState = transition.to();
                    const fromState = transition.from();
                    const params = transition.params();
                    let tryDesktop;

                    if (DEXW_LOCKED_STATES.indexOf(toState.name) === -1) {
                        return $state.target(DEXW_LOCKED_STATES[0]);
                    }

                    if (START_STATES.indexOf(toState.name) === -1) {
                        if (fromState.name === 'unavailable') {
                            return $state.target(START_STATES[0]);
                        }

                        if (!multiAccount.isSignedIn) {
                            return $state.target(START_STATES[0]);
                        }
                    }

                    if (toState.name === 'unavailable' && !this._unavailable) {
                        return $state.target(START_STATES[0]);
                    }

                    if (toState.name === 'desktop' && !this._canOpenDesktopPage) {
                        return $state.target(START_STATES[0]);
                    }

                    if (waiting) {
                        return null;
                    }

                    if (toState.name === 'main.dex-demo') {
                        tryDesktop = Promise.resolve();
                    } else {
                        tryDesktop = this._initTryDesktop();
                    }

                    waiting = true;

                    tryDesktop
                        .then(canChangeState => this._login(toState, canChangeState))
                        .then(() => {
                            waiting = false;
                            offInitialTransitions();

                            this._stopListenChangeLanguage();

                            if (START_STATES.indexOf(toState.name) === -1) {
                                $state.go(toState.name, params);
                            } else {
                                user.goToActiveState();
                            }

                            this._initializeTermsAccepted();

                            const offInnerTransitions = this._onInnerTransitions(
                                START_STATES.filter(state => state !== 'desktopUpdate'),
                                DEXW_LOCKED_STATES
                            );

                            user.logoutSignal.once(() => {
                                offInnerTransitions();
                                this._onInitialTransitions();
                            });
                        });
                });
            }

            _onInnerTransitions(START_STATES, DEXW_LOCKED_STATES) {
                return $transitions.onStart({}, transition => {
                    const toState = transition.to();

                    if (DEXW_LOCKED_STATES.indexOf(toState.name) === -1) {
                        return $state.target(DEXW_LOCKED_STATES[0]);
                    } else {
                        state.signals.changeRouterStateStart.dispatch(transition);
                    }
                });
            }

            /**
             * @return Promise
             * @private
             */
            _initializeTermsAccepted() {
                return storage.load('needReadNewTerms').then(needReadNewTerms => {
                    if (needReadNewTerms) {
                        return modalManager.showAcceptNewTerms(user);
                    }

                    return Promise.resolve();
                });
            }

            /**
             * @param {{name: string}} currentState
             * @param {boolean} canChangeState
             * @return {Promise}
             * @private
             */
            _login(currentState, canChangeState) {
                // const sessions = sessionBridge.getSessionsData();

                const states = WavesApp.stateTree.where({ noLogin: true })
                    .map((item) => WavesApp.stateTree.getPath(item.id).join('.'))
                    .concat(multiAccount.isSignedIn ? ['create', 'migrate'] : []);

                if (canChangeState && states.indexOf(currentState.name) === -1) {
                    // if (sessions.length) {
                    //     $state.go('sessions');
                    // } else {
                    $state.go(states[0]);
                    // }
                }

                return user.onLogin();
            }

            /**
             * @param {Event} event
             * @param {object} transition
             * @param {string} toState.name
             * @private
             */
            _onChangeStateSuccess(transition) {
                const toState = transition.to();
                const fromState = transition.from();
                const from = fromState.name || document.referrer;
                if (toState.name !== fromState.name) {
                    switch (toState.name) {
                        case 'create':
                            analytics.send({
                                name: 'Create New Account Show',
                                params: { from }
                            });
                            break;
                        case 'import':
                            analytics.send({
                                name: 'Import Accounts Show',
                                params: { from },
                                target: 'ui'
                            });
                            break;
                        case 'restore':
                            analytics.send({
                                name: 'Import Backup Show',
                                params: { from },
                                target: 'ui'
                            });
                            break;
                        case 'main.wallet.leasing':
                            analytics.send({
                                name: 'Leasing Show',
                                params: { from },
                                target: 'ui'
                            });
                            break;
                        case 'main.tokens':
                            analytics.send({
                                name: 'Token Generation Show',
                                target: 'ui'
                            });
                            break;
                        case 'main.wallet.assets':
                            analytics.send({
                                name: 'Wallet Assets Show',
                                target: 'ui'
                            });
                            break;
                        case 'main.wallet.portfolio':
                            analytics.send({
                                name: 'Wallet Portfolio Show',
                                target: 'ui'
                            });
                            break;
                        case 'main.dex':
                            analytics.send({
                                name: 'DEX Show',
                                target: 'ui'
                            });
                            break;
                        default:
                            break;
                    }

                    this.activeClasses.forEach((className) => {
                        document.body.classList.remove(className);
                    });
                    this.activeClasses = [];
                    toState.name.split('.')
                        .filter(Boolean)
                        .forEach((className) => {
                            const name = className.replace(/_/g, '-');
                            document.body.classList.add(name);
                            this.activeClasses.push(name);
                        });
                }

                user.applyState(toState);
                state.signals.changeRouterStateSuccess.dispatch(toState);
                analytics.send({ name: 'history_state', params: { url: toState.url } });
                analytics.send({ name: 'route', params: { from: fromState.url, to: toState.url } });
            }

            /**
             * @private
             */
            _stopLoader() {
                Promise.all([
                    this._getLocalizeReadyPromise(),
                    this._getImagesReadyPromise()
                ])
                    .then(() => {
                        LOADER.stop();
                        WavesApp.state = 'appRun';
                    })
                    .catch((e) => {
                        console.error(e);
                        WavesApp.state = 'loadingError';
                    });
            }

            /**
             * @return {Promise}
             * @private
             */
            _getLocalizeReadyPromise() {
                return new Promise((resolve) => {
                    i18next.on('initialized', () => {
                        LOADER.addProgress(PROGRESS_MAP.LOCALIZE_READY);
                        resolve();
                    });
                });
            }

            /**
             * @private
             */
            _getImagesReadyPromise() {
                return $.ajax({ url: `/img/images-list.json?v=${WavesApp.version}`, dataType: 'json' })
                    .then((list) => {
                        return Promise.all(list.map(AppRun.getLoadImagePromise(list.length)));
                    });
            }

        }

        return new AppRun();
    };

    run.$inject = [
        '$rootScope',
        'utils',
        'user',
        '$state',
        '$transitions',
        'state',
        'modalManager',
        'storage',
        'notification',
        'decorators',
        'multiAccount',
        'configService',
        'userNotification'
    ];

    angular.module('app').run(run);

    const { utils } = require('data-service');
    (new utils.ConfigService(WavesApp)).configReady.then(() => {
        $(() => angular.bootstrap(document.querySelector('html'), ['app']));
    });
    // Promise.all([onContentLoad, (new utils.ConfigService(WavesApp)).configReady]).then(() => {
    //     angular.bootstrap(document.querySelector('html'), ['app']);
    // });
})();

/**
 * @property {boolean} $rootScope.Scope#isDesktop
 * @property {boolean} $rootScope.Scope#isNotDesktop
 * @property {boolean} $rootScope.Scope#isPhone
 * @property {boolean} $rootScope.Scope#isNotPhone
 * @property {boolean} $rootScope.Scope#isTablet
 */
