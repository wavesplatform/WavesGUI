(function () {
    'use strict';

    /**
     *
     * @param {JQuery} $element
     * @param {Base} Base
     * @param {StyleManager} StyleManager
     * @return {Table}
     */
    const controller = function ($element, Base, StyleManager) {

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
                this.cid = tsUtils.uniqueId('tableView');
                $element.addClass(this.cid);
                this.styleManager = new StyleManager(this.cid);

                this.observe('selected', this._onChangeSelected);
            }

            $postLink() {
                this._onChangeSelected();
                this._initColumnWidths();
            }

            $onDestroy() {
                this.styleManager.destroy();
            }

            /**
             * @param {Row} row
             */
            registerRow(row) {
                this._children.push(row);
                this._setRowSelected(row);
            }

            /**
             * @private
             */
            _onChangeSelected() {
                this._children.forEach(this._setRowSelected, this);
            }

            _initColumnWidths() {
                const columnsCount = this._children[0].cells.length;
                const width = 100 / columnsCount;
                for (let i = 0; i < columnsCount; i++) {
                    this.styleManager.addStyle(`.cell-${i}`, { width: `${width}%` });
                }
            }

            /**
             * @param {Row} row
             * @private
             */
            _setRowSelected(row) {
                row.selected = (row.selectValue != null) && row.selectValue === this.selected;
            }

        }

        return new Table();
    };

    controller.$inject = ['$element', 'Base', 'StyleManager'];

    angular.module('app.ui')
        .component('wTable', {
            bindings: {
                selected: '='
            },
            transclude: true,
            template: '<div class="table__wrap" ng-transclude></div>',
            controller
        });
})();
