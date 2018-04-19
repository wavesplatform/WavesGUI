(function () {
    'use strict';


    class TableRow {

        constructor() {
            /**
             * @type {SmartTable}
             */
            this.body = null;
        }

    }

    angular.module('app.ui').directive('wTableRow', () => ({
        bindings: {},
        require: {
            body: '^wSmartTable'
        },
        replace: true,
        template: '<tr ng-transclude></tr>',
        transclude: true,
        controller: TableRow
    }));
})();
