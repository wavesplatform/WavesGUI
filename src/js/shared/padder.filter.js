(function () {
    'use strict';

    function PadderFilter() {
        return function filterInput(input, maxLength) {
            var spaces = '',
                i = input.length;

            while (i++ < maxLength) {
                spaces +=  '&nbsp;';
            }

            return spaces + input;
        };
    }

    angular
        .module('app.shared')
        .filter('padder', PadderFilter);
})();
