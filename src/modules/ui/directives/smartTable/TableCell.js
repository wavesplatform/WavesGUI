(function () {
    'use strict';


    class TableCell {

        constructor() {
            /**
             * @type {TableRow}
             */
            this.row = null;
        }

    }

    angular.module('app.ui').directive('wTableCell', () => ({
        bindings: {},
        require: {
            body: '^wTableRow'
        },
        replace: true,
        template: '<td ng-transclude></td>',
        transclude: true,
        controller: TableCell
    }));
})();
