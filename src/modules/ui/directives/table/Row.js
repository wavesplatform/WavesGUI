(function () {
    'use strict';

    const controller = function () {

        class Row {

            constructor() {
                /**
                 * @type {Table}
                 * @private
                 */
                this.table = null;
                /**
                 * @type {string|number}
                 */
                this.selectValue = null;
                /**
                 * @type {boolean}
                 */
                this.selected = false;
                /**
                 * @type {Array<Cell>}
                 */
                this.cells = [];
            }

            $postLink() {
                this.table.registerRow(this);
            }

            /**
             * @param {Cell} cell
             */
            registerCell(cell) {
                const index = this.cells.length;
                cell.setIndex(index);
                this.cells.push(cell);
            }

            select() {
                if (this.selectValue != null) {
                    this.table.selected = this.selectValue;
                }
            }

        }

        return new Row();
    };

    controller.$inject = [];

    angular.module('app.ui')
        .component('wRow', {
            bindings: {
                selectValue: '@'
            },
            require: {
                table: '^wTable'
            },
            transclude: true,
            template: '<div ng-click="$ctrl.select()" ng-transclude ng-class="{selected: $ctrl.selected}"' +
            ' class="table__row-wrap"></div>',
            controller
        });
})();
