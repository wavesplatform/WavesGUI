/* eslint-disable no-console */
/* global openInBrowser, BigNumber */
(function () {
    'use strict';

    const tsUtils = require('ts-utils');

    const PROGRESS_MAP = {
        RUN_SCRIPT: 10,
        APP_RUN: 15,
        LOCALIZE_READY: 25,
        IMAGES_LOADED: 50
    };

    const allProgress = Object.values(PROGRESS_MAP)
        .reduce((result, item) => result + item, 0);
    if (allProgress !== 100) {
        throw new Error('Configure loader progress!');
    }

    const LOADER = {
        _current: 0,
        _root: document.querySelector('.app-loader'),
        _element: document.querySelector('.app-loader .progress'),
        addProgress(delta) {
            this._current += delta;
            this._current = Math.min(this._current, 100);
            this._element.style.width = `${this._current}%`;
        },
        stop() {
            const loader = $(this._root);
            loader.fadeOut(1000, () => {
                loader.remove();
            });
        }
    };

    LOADER.addProgress(PROGRESS_MAP.RUN_SCRIPT);

    /**
     * @param {$rootScope.Scope} $rootScope
     * @param {User} user
     * @param {app.utils} utils
     * @param $state
     * @param {State} state
     * @param {ModalManager} modalManager
     * @param {Storage} storage
     * @param {INotification} notification
     * @param {app.utils.decorators} decorators
     * @param {Waves} waves
     * @param {ModalRouter} ModalRouter
     * @return {AppRun}
     */
    const run = function ($rootScope, utils, user, $state, state, modalManager, storage,
                          notification, decorators, waves, ModalRouter) {

        user.onLogin().then(() => {
            Waves.config.set({
                nodeAddress: user.getSetting('network.node'),
                matcherAddress: user.getSetting('network.matcher')
            });
        });


        const proxy = 'https://github-proxy.wvservices.com/wavesplatform/WavesGUI/client-907-fix-portfolio/scam.csv';
        const origin = 'https://raw.githubusercontent.com/wavesplatform/WavesGUI/client-907-fix-portfolio/scam.csv';
        const papa = require('papaparse');

        fetch(proxy)
            .catch(() => fetch(origin))
            .then((text) => {
                papa.parse(text).data.forEach(([id]) => {
                    WavesApp.scam[id] = true;
                });
            });

        class AppRun {

            constructor() {
                const identityImg = require('identity-img');

                LOADER.addProgress(PROGRESS_MAP.APP_RUN);

                /**
                 * List of css class on body (from current state)
                 * @type {Array<string>}
                 */
                this.activeClasses = [];
                /**
                 * @type {ModalRouter}
                 * @private
                 */
                this._modalRouter = new ModalRouter();
                /**
                 * @type {function}
                 * @private
                 */
                this._changeLangHandler = null;
                /**
                 * Configure library generation avatar by address
                 */
                identityImg.config({ rows: 8, cells: 8 });

                this._setHandlers();
                this._stopLoader();
                this._initializeLogin();
                this._initializeOutLinks();
                waves.node.assets.initializeAssetFactory();

                $rootScope.WavesApp = WavesApp;
            }

            /**
             * @private
             */
            _setHandlers() {
                $rootScope.$on('$stateChangeSuccess', this._onChangeStateSuccess.bind(this));
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
            _listenChangeLanguage() {
                this._changeLangHandler = () => {
                    localStorage.setItem('lng', i18next.language);
                };
                i18next.on('languageChanged', this._changeLangHandler);
            }

            /**
             * @private
             */
            _stopListenChangeLanguage() {
                i18next.off('languageChanged', this._changeLangHandler);
                this._changeLangHandler = null;
            }

            /**
             * @private
             */
            _initializeLogin() {

                storage.onReady().then((oldVersion) => {
                    if (!oldVersion) {
                        modalManager.showTutorialModals();
                    }
                });

                const START_STATES = WavesApp.stateTree.where({ noLogin: true })
                    .map((item) => item.id);

                this._listenChangeLanguage();
                const stop = $rootScope.$on('$stateChangeStart', (event, toState, params) => {
                    stop();

                    if (START_STATES.indexOf(toState.name) === -1) {
                        event.preventDefault();
                    }

                    this._login(toState)
                        .then(() => {
                            this._stopListenChangeLanguage();
                            if (START_STATES.indexOf(toState.name) === -1) {
                                $state.go(toState.name, params);
                            } else {
                                $state.go(user.getActiveState('wallet'));
                            }

                            i18next.changeLanguage(user.getSetting('lng'));

                            this._initializeTermsAccepted()
                                .then(() => {
                                    this._initializeBackupWarning();
                                })
                                .then(() => {
                                    this._modalRouter.initialize();
                                });

                            $rootScope.$on('$stateChangeStart', (event, current) => {
                                if (START_STATES.indexOf(current.name) !== -1) {
                                    event.preventDefault();
                                } else {
                                    state.signals.changeRouterStateStart.dispatch(event);
                                }
                            });
                        });
                });
            }

            /**
             * @return Promise
             * @private
             */
            _initializeTermsAccepted() {
                if (!user.getSetting('termsAccepted')) {
                    return modalManager.showTermsAccept(user).then(() => {
                        if (user.getSetting('shareAnalytics')) {
                            analytics.activate();
                        }
                    })
                        .catch(() => false);
                } else if (user.getSetting('shareAnalytics')) {
                    analytics.activate();
                }
                return Promise.resolve();
            }

            /**
             * @param {object} [scope]
             * @param {boolean} scope.closeByModal
             * @private
             */
            @decorators.scope({ closeByModal: false })
            _initializeBackupWarning(scope) {
                if (!user.getSetting('hasBackup')) {

                    const id = tsUtils.uniqueId('n');

                    const changeModalsHandler = (modal) => {

                        scope.closeByModal = true;
                        notification.remove(id);
                        scope.closeByModal = false;

                        modal.catch(() => null)
                            .then(() => {
                                if (!user.getSetting('hasBackup')) {
                                    this._initializeBackupWarning();
                                }
                            });
                    };

                    modalManager.openModal.once(changeModalsHandler);

                    notification.error({
                        id,
                        ns: 'app.utils',
                        title: {
                            literal: 'notification.backup.title'
                        },
                        body: {
                            literal: 'notification.backup.body'
                        },
                        action: {
                            literal: 'notification.backup.action',
                            callback: () => {
                                modalManager.showSeedBackupModal();
                            }
                        },
                        onClose: () => {
                            if (scope.closeByModal || user.getSetting('hasBackup')) {
                                return null;
                            }

                            modalManager.openModal.off(changeModalsHandler);

                            const stop = $rootScope.$on('$stateChangeSuccess', () => {
                                stop();
                                this._initializeBackupWarning();
                            });
                        }
                    }, -1);
                }
            }

            /**
             * @param {{name: string}} currentState
             * @return {Promise}
             * @private
             */
            _login(currentState) {
                // const sessions = sessionBridge.getSessionsData();

                const states = WavesApp.stateTree.where({ noLogin: true })
                    .map((item) => {
                        return WavesApp.stateTree.getPath(item.id)
                            .join('.');
                    });
                if (states.indexOf(currentState.name) === -1) {
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
             * @param {object} toState
             * @param some
             * @param fromState
             * @param {string} toState.name
             * @private
             */
            _onChangeStateSuccess(event, toState, some, fromState) {
                if (fromState.name) {
                    analytics.pushPageView(AppRun._getUrlFromState(toState), AppRun._getUrlFromState(fromState));
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
                user.applyState(toState);
                state.signals.changeRouterStateSuccess.dispatch(toState);
            }

            /**
             * @private
             */
            _stopLoader() {
                Promise.all([
                    this._getLocalizeReadyPromise(),
                    this._getImagesReadyPromise()
                ])
                    .then(() => LOADER.stop())
                    .catch((e) => {
                        console.error(e);
                        // TODO add error load application page
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

            static getLoadImagePromise(length) {
                return function (path) {
                    return new Promise((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => {
                            LOADER.addProgress(PROGRESS_MAP.IMAGES_LOADED / length);
                            resolve();
                        };
                        img.onerror = reject;
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

        }

        return new AppRun();
    };

    run.$inject = [
        '$rootScope',
        'utils',
        'user',
        '$state',
        'state',
        'modalManager',
        'storage',
        'notification',
        'decorators',
        'waves',
        'ModalRouter',
        'whatsNew'
    ];

    angular.module('app')
        .run(run);
})();
