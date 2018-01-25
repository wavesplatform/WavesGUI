(function () {
    'use strict';

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
     * @param $rootScope
     * @param {User} user
     * @param {app.utils} utils
     * @param $state
     * @param {State} state
     * @param {ModalManager} modalManager
     * @return {AppRun}
     */
    const run = function ($rootScope, utils, user, $state, state, modalManager) {

        class ExtendedAsset extends Waves.Asset {

            constructor(props) {
                super({
                    ...props,
                    name: WavesApp.remappedAssetNames[props.id] || props.name
                    // ID, name, precision and description are added here
                });

                this.reissuable = props.reissuable;
                this.timestamp = props.timestamp;
                this.sender = props.sender;
                this.height = props.height;

                const divider = new BigNumber(10).pow(this.precision);
                this.quantity = new BigNumber(props.quantity).div(divider);

                this.ticker = props.ticker || '';
                this.sign = props.sign || '';
                this.displayName = props.ticker || props.name;
            }

        }

        function remapAssetProps(props) {
            props.precision = props.decimals;
            delete props.decimals;
            return props;
        }

        Waves.config.set({
            assetFactory(props) {
                return fetch(`${WavesApp.network.api}/assets/${props.id}`)
                    .then(utils.onFetch)
                    .then((fullProps) => new ExtendedAsset(remapAssetProps(fullProps)))
                    .catch(() => {
                        return Waves.API.Node.v1.transactions.get(props.id)
                            .then((partialProps) => new ExtendedAsset(remapAssetProps(partialProps)));
                    });
            }
        });

        user.onLogin().then(() => {
            Waves.config.set({
                nodeAddress: user.getSetting('network.node'),
                matcherAddress: user.getSetting('network.matcher')
            });
        });

        class AppRun {

            constructor() {

                LOADER.addProgress(PROGRESS_MAP.APP_RUN);

                /**
                 * List of css class on body (from current state)
                 * @type {Array<string>}
                 */
                this.activeClasses = [];
                this._changeLangHandler = null;

                /**
                 * Configure library generation avatar by address
                 */
                identityImg.config({ rows: 8, cells: 8 });

                this._setHandlers();
                this._stopLoader();
                this._initializeLogin();
                this._initializeOutLinks();
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
                        const shell = require('electron').shell;
                        e.preventDefault();

                        shell.openExternal($link.attr('href'));
                    });
                }
            }

            _listenChangeLanguage() {
                this._changeLangHandler = () => {
                    localStorage.setItem('lng', i18next.language);
                };
                i18next.on('languageChanged', this._changeLangHandler);
            }

            _stopListenChangeLanguage() {
                i18next.off('languageChanged', this._changeLangHandler);
                this._changeLangHandler = null;
            }

            /**
             * @private
             */
            _initializeLogin() {
                const START_STATES = WavesApp.stateTree.where({ noLogin: true })
                    .map((item) => item.id);

                this._listenChangeLanguage();
                const stop = $rootScope.$on('$stateChangeStart', (event, state, params) => {
                    stop();

                    if (START_STATES.indexOf(state.name) === -1) {
                        event.preventDefault();
                    }

                    this._login(state)
                        .then(() => {
                            this._stopListenChangeLanguage();
                            if (START_STATES.indexOf(state.name) === -1) {
                                $state.go(state.name, params);
                            } else {
                                $state.go(user.getActiveState('wallet'));
                            }

                            const termsAccepted = user.getSetting('termsAccepted');
                            i18next.changeLanguage(user.getSetting('lng'));

                            if (!termsAccepted) {
                                modalManager.showTermsAccept(user).then(() => {
                                    if (user.getSetting('shareAnalytics')) {
                                        analytics.activate();
                                    }
                                });
                            } else if (user.getSetting('shareAnalytics')) {
                                analytics.activate();
                            }

                            $rootScope.$on('$stateChangeStart', (event, state) => {
                                if (START_STATES.indexOf(state.name) !== -1) {
                                    event.preventDefault();
                                    $state.go(user.getActiveState('wallet'));
                                }
                            });
                        });
                });
            }

            /**
             * @param {{name: string}} currentState
             * @return {Promise}
             * @private
             */
            _login(currentState) {
                const states = WavesApp.stateTree.where({ noLogin: true })
                    .map((item) => {
                        return WavesApp.stateTree.getPath(item.id)
                            .join('.');
                    });
                if (states.indexOf(currentState.name) === -1) {
                    $state.go(states[0]);
                }
                return user.onLogin();
            }

            /**
             * @param {Event} event
             * @param {object} toState
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
                state.signals.changeRouterState.dispatch(toState);
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
                return '/' + WavesApp.stateTree.getPath(state.name.split('.').slice(-1)[0])
                    .filter((id) => !WavesApp.stateTree.find(id).get('abstract'))
                    .map((id) => WavesApp.stateTree.find(id).get('url') || id)
                    .join('/');
            }

        }

        return new AppRun();
    };

    run.$inject = ['$rootScope', 'utils', 'user', '$state', 'state', 'modalManager', 'modalRouter'];

    angular.module('app')
        .run(run);
})();
