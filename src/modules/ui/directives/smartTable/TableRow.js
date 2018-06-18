(function () {
    'use strict';

    class Row {

        constructor($element, stService) {
            this.stService = stService;
            this._children = [];
            this.parentCid = $element.closest('[data-cid]').attr('data-cid');
        }

        registerCell($element, id) {
            this._children.push({ $element, id });
            this._children.forEach(this._updateId, this);
        }

        /**
         * @param {JQuery} $element
         * @param {string} id
         * @private
         */
        _updateId({ $element, id }) {
            const index = $element.index();
            const idAttrName = 'data-column-id';
            const element = $element.get(0);

            if (element.parentElement) {
                $element.attr(idAttrName, this.stService.getTableByCid(this.parentCid).getIdByIndex(index));
            } else {
                $element.attr(idAttrName, id);
            }
        }

    }

    Row.$inject = ['$element', 'stService'];

    angular.module('app.ui').directive('wTableRow', () => ({
        bindings: {},
        replace: true,
        template: '<div class="smart-table__row" ng-transclude></div>',
        transclude: true,
        controller: Row
    }));
})();
