(function () {
    'use strict';

    angular
        .module('app.core.services')
        .service('apiService', ['Restangular', function (rest) {
            var blocksApi = rest.service('blocks');

            this.blocks = {
                height: function() {
                    return blocksApi.all('height').get();
                },
                last: function() {
                    return blocksApi.all('last').get();
                },
                list: function (start, end) {
                    return blocksApi.one('seq', start).all(end).getList();
                }
            };

            var addressApi = rest.service('addresses');
            this.address = {
                balance: function (address) {
                    return addressApi.one('balance', address.getRawAddress()).get();
                }
            };

            var transactionApi = rest.service('transactions');
            this.transactions = {
                unconfirmed: function () {
                    return transactionApi.all('unconfirmed').getList();
                },
                list: function (address, max) {
                    max = max || 50;
                    return transactionApi.one('address', address.getRawAddress()).one('limit', max).getList();
                }
            };

            var wavesApi = rest.service('waves');
            this.broadcastPayment = function (signedPaymentTransaction) {
                return wavesApi.all('broadcast-signed-payment').post(signedPaymentTransaction);
            };
        }]);
})();
