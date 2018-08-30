(function () {
    'use strict';

    const BASE_URL = 'https://wavesexplorer.com';
    const TX_PREFIX = 'tx';

    /**
     * @return {ExplorerLinks}
     */
    const factory = function () {
        class ExplorerLinks {

            getTxLink(transactionId) {
                return `${BASE_URL}/${TX_PREFIX}/${transactionId}`;
            }

        }

        return new ExplorerLinks();
    };

    angular.module('app.utils').factory('explorerLinks', factory);
})();
