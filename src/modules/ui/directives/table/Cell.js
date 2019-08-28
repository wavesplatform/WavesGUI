(function () {
    'use strict';

    /**
     * @param {JQuery} $element
     * @return {Cell}
     */
    const controller = function ($element) {

        class Cell {

            constructor() {
                /**
                 * @type {Row}
                 */
                this.row = null;
            }

            $postLink() {
                this.row.registerCell(this);
            }

            setIndex(index) {
                $element.addClass(`cell-${index}`);
            }

            getWidth() {
                return $element.width();
            }

        }

        return new Cell();
    };

    controller.$inject = ['$element'];

    angular.module('app.ui')
        .component('wCell', {
            require: {
                row: '^wRow'
            },
            transclude: true,
            template: '<div ng-transclude class="table__cell-wrap"></div>',
            controller
        });
})();
