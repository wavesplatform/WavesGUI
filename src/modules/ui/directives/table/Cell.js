(function () {
    'use strict';

    const controller = function () {

        class Cell {

            constructor() {
                /**
                 * @type {Row}
                 */
                this.row = null;
            }

        }

        return new Cell();
    };

    angular.module('app.ui')
        .component('wCell', {
            require: {
                row: '^wRow'
            },
            transclude: true,
            template: '<div ng-transclude class="table-cell"></div>',
            controller
        });
})();
