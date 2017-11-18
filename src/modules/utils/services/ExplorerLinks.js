(function () {
    'use strict';

    const BASE_URL = 'http://wavesexplorer.com';
    const TX_PREFIX = 'tx';

    const factory = function () {
        return {

            getTxLink(transactionId) {
                return `${BASE_URL}/${TX_PREFIX}/${transactionId}`;
            }

        };
    };

    angular.module('app.utils').factory('explorerLinks', factory);
})();
