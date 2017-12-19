(function () {
    'use strict';

    /**
     * @param {User} user
     * @param {ModalManager} modalManager
     * @param {Waves} waves
     * @param {Router} router
     * @param $rootScope
     * @return {ModalRouter}
     */
    const factory = function (user, modalManager, waves, router, $rootScope) {

        class ModalRouter {

            constructor() {

                this.sleep = false;
                router.registerRouteHash(this._wrapClose(this._getRoutes()));

                window.addEventListener('hashchange', () => {
                    if (!this.sleep) {
                        this._apply();
                    }
                }, false);

                user.onLogin().then(() => {
                    const stop = $rootScope.$on('$stateChangeSuccess', () => {
                        stop();
                        setTimeout(() => {
                            this._apply();
                        }, 1000);
                    });
                });
            }

            /**
             * @private
             */
            _apply() {
                router.apply(`/${decodeURIComponent(location.hash.replace('#', ''))}`);
            }

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
                    '/account': () => modalManager.showAccountInfo()
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
                    hash[key] = (data) => {
                        this.sleep = true;
                        return user.onLogin().then(() => {
                            const result = handler(data);
                            if (!result || !result.then || typeof result.then !== 'function') {
                                throw new Error('Modal result mast be a promise!');
                            }
                            const cb = () => {
                                this.sleep = false;
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

        return new ModalRouter();
    };

    factory.$inject = ['user', 'modalManager', 'waves', 'router', '$rootScope'];

    angular.module('app.ui').factory('modalRouter', factory);
})();
