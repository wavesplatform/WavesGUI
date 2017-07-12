(function () {
    'use strict';

    const DEFAULT_STRIP_ZEROES = false;
    const DEFAULT_USE_THOUSANDS_SEPARATOR = true;

    function MoneyLong() {
        return function filterInput(input, stripZeroes, useThousandsSeparator) {
            if (!input || !input.formatAmount) {
                return ``;
            }

            if (angular.isUndefined(stripZeroes)) {
                stripZeroes = DEFAULT_STRIP_ZEROES;
            }

            if (angular.isUndefined(useThousandsSeparator)) {
                useThousandsSeparator = DEFAULT_USE_THOUSANDS_SEPARATOR;
            }

            const result = input.formatAmount(stripZeroes, useThousandsSeparator);
            const currency = input.currency.shortName ? input.currency.shortName : input.currency.displayName;

            return `${result} ${currency}`;
        };
    }

    angular
        .module(`app.shared`)
        .filter(`moneyLong`, MoneyLong);
})();
