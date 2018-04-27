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
        template: '<div class="smart-table__cell" ng-transclude></div>',
        transclude: true,
        controller: TableCell
    }));
})();
