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
        template: '<div class="smart-table__row" ng-transclude></div>',
        transclude: true,
        controller: TableRow
    }));
})();
