(function () {
    'use strict';

    function AssetFilter(applicationContext, addressService) {
        function transformAddress (rawAddress) {
            var result = angular.isDefined(rawAddress) ? rawAddress : 'n/a';

            if (isMyAddress(result))
                result = 'You';

            return result;
        }

        function isMyAddress(address) {
            return address === applicationContext.account.address;
        }

        function formatAsset (transaction) {
            transaction.formatted = {
                sender: transformAddress(transaction.sender),
                canReissue: transaction.reissuable && isMyAddress(transaction.sender)
            };

            return transaction;
        }

        return function filterInput (input) {
            return _.map(input, formatAsset);
        };
    }

    AssetFilter.$inject = ['applicationContext', 'addressService'];

    angular
        .module('app.portfolio')
        .filter('asset', AssetFilter);
})();
