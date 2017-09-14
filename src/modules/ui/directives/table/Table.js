(function () {
    'use strict';

    const controller = function (Base) {

        class Table extends Base {

            constructor() {
                super();
                /**
                 * @type {Array<Row>}
                 * @private
                 */
                this._children = [];
                /**
                 * @type {string|number}
                 */
                this.selected = null;

                this.observe('selected', this._onChangeSelected);
            }

            $postLink() {
                if (this.selected != null) {
                    this._onChangeSelected();
                }
            }

            /**
             * @param {Row} row
             */
            registerRow(row) {
                this._children.push(row);
                if (this.selected != null) {
                    this._setRowSelected(row);
                }
            }

            _onChangeSelected() {
                this._children.forEach(this._setRowSelected, this);
            }

            /**
             * @param {Row} row
             * @private
             */
            _setRowSelected(row) {
                row.selected = row.selectValue === this.selected;
            }

        }

        return new Table();
    };

    controller.$inject = ['Base'];

    angular.module('app.ui')
        .component('wTable', {
            bindings: {
                selected: '='
            },
            transclude: true,
            template: '<div class="table" ng-transclude></div>',
            controller
        });
})();
