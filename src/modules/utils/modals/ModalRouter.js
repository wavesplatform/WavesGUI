(function () {
    'use strict';

    /**
     * @param {User} user
     * @param {ModalManager} modalManager
     * @param {Waves} waves
     * @param {typeof Router} Router
     * @param {app.utils} utils
     * @return {ModalRouter}
     */
    const factory = function (user, modalManager, waves, Router, utils) {

        class ModalRouter {


            constructor() {
                /**
                 * @type {boolean}
                 * @private
                 */
                this._sleep = false;
                /**
                 * @type string
                 * @private
                 */
                this._firstUrl = ModalRouter._getUrlData();
                this._router = new Router();
                this._router.registerRouteHash(this._wrapClose(this._getRoutes()));

                if (WavesApp.isDesktop()) {
                    window.listenMainProcessEvent((eventType, urlString) => {
                        user.onLogin().then(() => {
                            const { hash } = utils.parseElectronUrl(urlString);
                            if (hash) {
                                this._apply(ModalRouter._getUrlData(hash.replace('#', '')));
                            }
                        });
                    });
                }
            }

            initialize() {
                window.addEventListener('hashchange', () => {
                    if (!this._sleep) {
                        this._apply(ModalRouter._getUrlData());
                    }
                }, false);

                waves.node.assets.userBalances().then(() => {
                    this._apply(this._firstUrl);
                });
            }

            /**
             * @param {string} url
             * @private
             */
            _apply(url) {
                return this._router.apply(url);
            }

            /**
             * @return {Object.<function>}
             * @private
             */
            _getRoutes() {
                return {
                    [Router.ROUTES.SEND]: () => modalManager.showSendAsset(),
                    [Router.ROUTES.SEND_ASSET]: ({ assetId }, search) => {
                        return modalManager.showSendAsset({ ...search, assetId });
                    },
                    [Router.ROUTES.ASSET_INFO]: ({ assetId }) => {
                        return waves.node.assets.getAsset(assetId).then((asset) => {
                            return modalManager.showAssetInfo(asset);
                        });
                    },
                    // '/receive': () => modalManager.showReceiveAsset(user), // TODO : decide on that
                    [Router.ROUTES.ACCOUNT]: () => modalManager.showAccountInfo(),
                    [Router.ROUTES.GATEWAY_AUTH]: (params, search) => modalManager.showGatewaySign(search)
                };
            }

            /**
             * @param hash
             * @returns {*}
             * @private
             */
            _wrapClose(hash) {
                Object.keys(hash).forEach((key) => {
                    const handler = hash[key];
                    hash[key] = (...args) => {
                        this._sleep = true;
                        return user.onLogin().then(() => {
                            const result = handler(...args);
                            if (!result || !result.then || typeof result.then !== 'function') {
                                throw new Error('Modal result mast be a promise!');
                            }
                            const cb = () => {
                                this._sleep = false;
                                location.hash = '';
                            };
                            result.then(cb, cb);
                            return result;
                        });
                    };
                });
                return hash;
            }

            /**
             * @param {string} [fromUrl]
             * @return {string}
             * @private
             */
            static _getUrlData(fromUrl) {
                return `/${decodeURIComponent(fromUrl || ModalRouter._getLocation())}`;
            }

            /**
             * @return {string}
             * @private
             */
            static _getLocation() {
                if (WavesApp.isDesktop()) {
                    const lastIndex = location.hash.lastIndexOf('#');
                    const firstIndex = location.hash.indexOf('#');
                    return lastIndex > firstIndex ? location.hash.slice(lastIndex + 1) : '';
                } else {
                    return location.hash.replace('#', '');
                }
            }

        }

        return ModalRouter;
    };

    factory.$inject = ['user', 'modalManager', 'waves', 'Router', 'utils'];

    angular.module('app.ui').factory('ModalRouter', factory);
})();
