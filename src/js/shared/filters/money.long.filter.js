(function () {
    'use strict';

    var DEFAULT_STRIP_ZEROES = false;
    var DEFAULT_USE_THOUSANDS_SEPARATOR = true;

    function MoneyLongFilter() {
        return function filterInput(input, stripZeroes, useThousandsSeparator) {
            if (!input || !input.formatAmount) {
                return '';
            }

            if (angular.isUndefined(stripZeroes)) {
                stripZeroes = DEFAULT_STRIP_ZEROES;
            }

            if (angular.isUndefined(useThousandsSeparator)) {
                useThousandsSeparator = DEFAULT_USE_THOUSANDS_SEPARATOR;
            }

            var result = input.formatAmount(stripZeroes, useThousandsSeparator);
            var currency = input.currency.shortName ? input.currency.shortName : input.currency.displayName;

            return result + ' ' + currency;
        };
    }

    angular
        .module('app.shared')
        .filter('moneyLong', MoneyLongFilter);
})();
