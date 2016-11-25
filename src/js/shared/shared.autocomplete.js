(function () {
    'use strict';

    angular
        .module('app.shared')
        .factory('autocomplete.fees', function AutocompleteFeesFactory() {
            var result = {
                fees: [
                    {
                        amount: 0.001,
                        displayText: '0.001 WAVE (Economic)'
                    },
                    {
                        amount: 0.0015,
                        displayText: '0.0015 WAVE (Standard)'
                    },
                    {
                        amount: 0.002,
                        displayText: '0.002 WAVE (Premium)'
                    }
                ],
                selectedFee: undefined,
                searchText: undefined
            };

            result.getFeeAmount = function() {
                return angular.isDefined(result.selectedFee) ?
                    result.selectedFee.amount :
                    result.searchText;
            };

            result.querySearch = function (searchText) {
                if (!searchText)
                    return result.fees;

                return _.filter(result.fees, function (item) {
                    return item.amount.toString().indexOf(searchText) !== -1;
                });
            };

            return result;
        });
})();
