(function () {
    'use strict';

    const DEFAULT_STRIP_ZEROES = true;
    const DEFAULT_USE_THOUSANDS_SEPARATOR = true;

    function MoneyShort() {
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

            return input.formatAmount(stripZeroes, useThousandsSeparator);
        };
    }

    angular
        .module(`app.shared`)
        .filter(`moneyShort`, MoneyShort);
})();
