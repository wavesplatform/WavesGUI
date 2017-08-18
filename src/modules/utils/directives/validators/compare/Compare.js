(function () {
    'use strict';

    angular.module('app.utils').directive('wCompareTo', () => {
        return {
            require: 'ngModel',
            restrict: 'A',
            scope: {
                compareTo: '<wCompareTo'
            },
            link: function (scope, elm, attrs, ctrl) {
                ctrl.$validators.wCompareTo = (val) => {
                    return val === scope.compareTo;
                };
                scope.$watch('compareTo', () => {
                    ctrl.$validate();
                });
            }
        };
    });
})();
