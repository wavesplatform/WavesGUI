(function () {
    'use strict';

    const factory = function () {

        class Router {

            constructor() {
                this._routesHash = Object.create(null);
            }

            apply(url, search) {
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
                tsUtils.each(hash, (listener, url) => {
                    this.registerRoute(url, listener);
                });
            }

        }

        return new Router();
    };

    factory.$inject = [];

    angular.module('app.utils').factory('router', factory);
})();
