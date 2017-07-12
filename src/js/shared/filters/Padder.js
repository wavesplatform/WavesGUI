(function () {
    'use strict';

    function Padder() {
        return function filterInput(input, maxLength) {
            let spaces = ``,
                i = input.length;

            while (i++ < maxLength) {
                spaces += `&nbsp;`;
            }

            return spaces + input;
        };
    }

    angular
        .module(`app.shared`)
        .filter(`padder`, Padder);
})();
