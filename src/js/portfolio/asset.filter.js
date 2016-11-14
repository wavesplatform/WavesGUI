(function () {
    'use strict';

    function AssetFilter(applicationContext, addressService) {
        function transformAddress (rawAddress) {
            var result = angular.isDefined(rawAddress) ? rawAddress : 'none';

            if (result === applicationContext.account.address)
                result = 'You';

            return result;
        }

        function formatAsset (transaction) {
            transaction.formatted = {
                sender: transformAddress(transaction.sender)
            };

            transaction.formatted.isSenderCopiable = addressService.validateAddress(transaction.formatted.sender);

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
