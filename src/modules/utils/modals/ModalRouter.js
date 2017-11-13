(function () {
    'use strict';

    /**
     * @param {User} user
     * @param {ModalManager} modalManager
     * @param {AssetsService} assetsService
     * @param {Router} router
     * @param $rootScope
     * @return {ModalRouter}
     */
    const factory = function (user, modalManager, assetsService, router, $rootScope) {

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

            _apply() {
                router.apply(`/${decodeURIComponent(location.hash.replace('#', ''))}`);
            }

            _getRoutes() {
                return {
                    '/send': () => modalManager.showSendAsset({ canChooseAsset: true, user }),
                    '/send/:assetId': ({ assetId }) => {
                        return assetsService.getAssetInfo(assetId).then(() => {
                            return modalManager.showSendAsset({ canChooseAsset: false, assetId, user });
                        });
                    },
                    '/asset/:assetId': ({ assetId }) => {
                        return assetsService.getAssetInfo(assetId).then((asset) => {
                            return modalManager.showAssetInfo(asset);
                        });
                    },
                    '/receive': () => modalManager.showReceiveAsset(user),
                    '/account': () => modalManager.showAccountInfo()
                };
            }

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

    factory.$inject = ['user', 'modalManager', 'assetsService', 'router', '$rootScope'];

    angular.module('app.ui').factory('modalRouter', factory);
})();
