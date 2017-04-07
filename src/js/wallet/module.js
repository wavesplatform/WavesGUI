(function() {
    'use strict';

    angular.module('app.wallet', ['app.shared'])
        .constant('wallet.events', {
            WALLET_SEND: 'wallet-send',
            WALLET_WITHDRAW: 'wallet-withdraw',
            WALLET_DEPOSIT: 'wallet-deposit',
            WALLET_DETAILS: 'wallet-details',
            WALLET_LEASE: 'wallet-lease',
            WALLET_CARD_DEPOSIT: 'wallet-card-deposit'
        });
})();
