(function () {
    'use strict';

    const allowedParams = [`amount`, `label`, `message`];

    function BitcoinUriService() {

        this.generate = function (address, params) {

            if (!address || typeof address !== `string`) {
                return ``;
            }

            const keys = Object.keys(params || {});
            let uri = `bitcoin:${address}`;

            if (keys.length) {
                uri += keys.reduce((queryString, key) => {
                    if (allowedParams.indexOf(key) > -1) {
                        return `${queryString + key}=${params[key]}&`;
                    } else {
                        return queryString;
                    }
                }, `?`);
                uri = uri.slice(0, -1); // Remove trailing '&'
            }

            return uri;

        };

        // this.validate = function (uri) {};

    }

    angular
        .module(`app.shared`)
        .service(`bitcoinUriService`, BitcoinUriService);
})();
