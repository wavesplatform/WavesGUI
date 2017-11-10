(function () {
    'use strict';

    const PROGRESS_MAP = {
        RUN_SCRIPT: 3,
        APP_RUN: 5,
        LOCALIZE_READY: 22,
        IMAGES_LOADED: 45,
        WORKER_READY: 25
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
     * @param $rootScope
     * @param {User} user
     * @param $state
     * @param apiWorker
     * @param {State} state
     * @param {ModalManager} modalManager
     * @return {AppRun}
     */
    const run = function ($rootScope, user, $state, apiWorker, state, modalManager) {

        class AppRun {

            constructor() {

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

                this._setHandlers();
                this._stopLoader();
                this._initializeLogin();
            }

            /**
             * @private
             */
            _setHandlers() {
                $rootScope.$on('$stateChangeSuccess', this._onChangeStateSuccess.bind(this));
            }

            _initializeLogin() {
                const START_STATES = WavesApp.stateTree.where({ noLogin: true }).map((item) => item.id);
                const stop = $rootScope.$on('$stateChangeSuccess', (event, state, params) => {
                    user.login()
                        .then(() => {
                            if (START_STATES.indexOf(state.name) === -1) {
                                $state.go(state.name, params);
                            } else {
                                $state.go(user.getActiveState('wallet'));
                            }
                            user.getSetting('termsAccepted').then((termsAccepted) => {
                                if (!termsAccepted) {
                                    modalManager.showTermsAccept(user);
                                }
                            });
                        });
                    stop();
                });

                $rootScope.$on('$stateChangeStart', (event, state) => {
                    if (user.address) {
                        if (START_STATES.indexOf(state.name) !== -1) {
                            event.preventDefault();
                            user.logout();
                        }
                    }
                });
            }

            /**
             * @param {Event} event
             * @param {Object} toState
             * @param {string} toState.name
             * @private
             */
            _onChangeStateSuccess(event, toState) {
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
                state.signals.changeRouterState.dispatch(toState);
            }

            /**
             * @private
             */
            _stopLoader() {
                Promise.all([
                    this._getLocalizeReadyPromise(),
                    this._getImagesReadyPromise(),
                    this._getWorkerReadyPromise()
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
                return fetch('/img/images-list.json')
                    .then(r => r.json())
                    .then((list) => {
                        return Promise.all(list.map(AppRun.getLoadImagePromise(list.length)));
                    });
            }

            /**
             * @private
             */
            _getWorkerReadyPromise() {
                return apiWorker.process(() => null)
                    .then(() => {
                        LOADER.addProgress(PROGRESS_MAP.WORKER_READY);
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

        }

        return new AppRun();
    };

    run.$inject = ['$rootScope', 'user', '$state', 'apiWorker', 'state', 'modalManager', 'modalRouter'];

    angular.module('app')
        .run(run);
})();
