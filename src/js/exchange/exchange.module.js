(function() {
    'use strict';

    angular.module('app.exchange', ['app.shared'])
        .constant('exchange.events', {
            EXCHANGE_SHOW_PAIR_LIST: 'show-pair-list',
            EXCHANGE_OPEN_NEW_PAIR: 'open-new-pair',
            EXCHANGE_SHOW_PAIR_MARKET: 'show-pair-market'
        });
})();
