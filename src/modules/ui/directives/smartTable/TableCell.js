(function () {
    'use strict';

    /**
     * @param {STService} stService
     * @return {*}
     */
    const directive = (stService) => ({
        bindings: {},
        replace: true,
        template: '<div class="smart-table__cell" ng-transclude></div>',
        transclude: true,
        /**
         * @param {$rootScope.Scope} $scope
         * @param {JQuery} $element
         */
        link: {
            post: function ($scope, $element) {
                const parentCid = $element.closest('[data-cid]').attr('data-cid');
                const element = $element.get(0);
                const index = $element.index();
                const idAttrName = 'data-column-id';

                if (element.parentElement) {
                    $element.attr(idAttrName, stService.getTableByCid(parentCid).getIdByIndex(index));
                } else {
                    $element.attr(idAttrName, $scope.id);
                }
            }
        }
    });

    directive.$inject = ['stService'];

    angular.module('app.ui').directive('wTableCell', directive);
})();
