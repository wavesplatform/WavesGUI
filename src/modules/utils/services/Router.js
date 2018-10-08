(function () {
    'use strict';

    /**
     * @param {app.utils} utils
     * @return {Router}
     */
    const factory = function (utils) {

        const { each } = require('ts-utils');

        class Router {

            constructor() {
                this._routesHash = Object.create(null);
            }

            apply(fullUrl) {
                const [url, searchStr] = fullUrl.split('?');
                const search = utils.parseSearchParams(searchStr);
                const parts = url.split('/');
                const urls = Object.keys(this._routesHash)
                    .sort((a, b) => {
                        const reg = /:/g;
                        return (a.match(reg) || { length: 0 }).length - (b.match(reg) || { length: 0 }).length;
                    })
                    .map((url) => url.split('/'))
                    .filter((routeParts) => routeParts.length === parts.length);

                let listener = null;
                let params = null;

                urls.some((routeParts) => {
                    const urlParams = Object.create(null);
                    const valid = routeParts.every((part, i) => {
                        if (part.charAt(0) === ':') {
                            urlParams[part.substr(1)] = parts[i];
                            return true;
                        } else {
                            return part === parts[i];
                        }
                    });
                    if (valid) {
                        params = urlParams;
                        listener = this._routesHash[routeParts.join('/')];
                    }
                    return valid;
                });

                if (listener) {
                    return listener(params, search);
                }
                return null;
            }

            registerRoute(route, listener) {
                this._routesHash[route] = listener;
            }

            registerRouteHash(hash) {
                each(hash, (listener, url) => {
                    this.registerRoute(url, listener);
                });
            }

            static ROUTES = {
                SEND: '/send',
                SEND_ASSET: '/send/:assetId',
                ASSET_INFO: '/asset/:assetId',
                ACCOUNT: '/account',
                GATEWAY_AUTH: '/gateway/auth'
            };

        }

        return Router;
    };

    factory.$inject = ['utils'];

    angular.module('app.utils').factory('Router', factory);
})();
