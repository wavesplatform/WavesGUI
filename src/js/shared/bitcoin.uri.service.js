(function () {
    'use strict';

    var allowedParams = ['amount', 'label', 'message'];

    angular
        .module('app.shared')
        .service('bitcoinUriService', [function () {

            this.generate = function (address, params) {

                if (!address || typeof address !== 'string') {
                    return '';
                }

                var uri = 'bitcoin:' + address,
                    keys = Object.keys(params || {});

                if (keys.length) {
                    uri += keys.reduce(function (queryString, key) {
                        if (allowedParams.indexOf(key) > -1) {
                            return queryString + key + '=' + params[key] + '&';
                        } else {
                            return queryString;
                        }
                    }, '?');
                    uri = uri.slice(0, -1); // Remove trailing '&'
                }

                return uri;

            };

            // this.validate = function (uri) {};

        }]);
})();
