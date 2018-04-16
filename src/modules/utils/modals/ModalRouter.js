(function () {
    'use strict';

    /**
     * @param {User} user
     * @param {ModalManager} modalManager
     * @param {Waves} waves
     * @param {Router} router
     * @param {$rootScope.Scope} $rootScope
     * @param {app.utils} utils
     * @return {ModalRouter}
     */
    const factory = function (user, modalManager, waves, router, $rootScope, utils) {

        class ModalRouter {

            constructor() {
                /**
                 * @type {boolean}
                 * @private
                 */
                this._sleep = false;
                router.registerRouteHash(this._wrapClose(this._getRoutes()));
            }

            initialize() {
                window.addEventListener('hashchange', () => {
                    if (!this._sleep) {
                        this._apply();
                    }
                }, false);

                this._apply();
            }

            /**
             * @private
             */
            _apply() {
                const fullUrl = `/${decodeURIComponent(location.hash.replace('#', ''))}`;
                const [url, search] = fullUrl.split('?');
                router.apply(url, utils.parseSearchParams(search));
            }

            /**
             * @return {Object.<function>}
             * @private
             */
            _getRoutes() {
                return {
                    '/send': () => modalManager.showSendAsset(user),
                    '/send/:assetId': ({ assetId }) => {
                        return waves.node.assets.info(assetId).then(() => {
                            return modalManager.showSendAsset(user, { assetId });
                        });
                    },
                    '/asset/:assetId': ({ assetId }) => {
                        return waves.node.assets.info(assetId).then((asset) => {
                            return modalManager.showAssetInfo(asset);
                        });
                    },
                    // '/receive': () => modalManager.showReceiveAsset(user), // TODO : decide on that
                    '/account': () => modalManager.showAccountInfo(),
                    '/gateway/auth': (params, search) => modalManager.showGatewaySign(search)
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

        }

        return ModalRouter;
    };

    factory.$inject = ['user', 'modalManager', 'waves', 'router', '$rootScope', 'utils'];

    angular.module('app.ui').factory('ModalRouter', factory);
})();
