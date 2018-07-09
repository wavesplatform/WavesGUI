(function () {
    'use strict';

    const directive = () => ({
        require: {
            parent: '?^wTableRow'
        },
        replace: true,
        template: '<div class="smart-table__cell" ng-transclude></div>',
        transclude: true,
        /**
         * @param {$rootScope.Scope} $scope
         * @param {JQuery} $element
         */
        link: {
            post: function ($scope, $element, _, { parent }) {
                const idAttrName = 'data-column-id';

                if (parent) {
                    parent.registerCell($element, $scope.id);
                } else {
                    $element.attr(idAttrName, $scope.id);
                }
            }
        }
    });

    angular.module('app.ui').directive('wTableCell', directive);
})();
