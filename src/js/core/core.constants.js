(function() {
    'use strict';

    angular
        .module('app.core')
        .constant('constants.core', {
            CLIENT_VERSION: '0.4.1a',
            NODE_ADDRESS: 'http://52.30.47.67:6869',
            NETWORK_NAME: 'devel',
            ADDRESS_VERSION: 1,
            NETWORK_CODE: 'T',
            INITIAL_NONCE: 0
        });

    angular
        .module('app.core')
        .constant('constants.address', {
            RAW_ADDRESS_LENGTH : 35,
            ADDRESS_PREFIX: '1W',
            MAINNET_ADDRESS_REGEXP: /^[a-zA-Z0-9]{35}$/
        });

    angular
        .module('app.core')
        .constant('constants.ui', {
            MINIMUM_PAYMENT_AMOUNT : 1e-8,
            MINIMUM_TRANSACTION_FEE : 0.001,
            AMOUNT_DECIMAL_PLACES : 8
        });
})();
