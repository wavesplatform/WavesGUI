(function () {
    'use strict';

    var DEFAULT_STRIP_ZEROES = true;
    var DEFAULT_USE_THOUSANDS_SEPARATOR = true;

    function MoneyShortFilter() {
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

            return input.formatAmount(stripZeroes, useThousandsSeparator);
        };
    }

    angular
        .module('app.shared')
        .filter('moneyShort', MoneyShortFilter);
})();
