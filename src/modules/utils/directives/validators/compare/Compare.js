(function () {
    'use strict';

    angular.module('app.utils')
        .directive('wCompareTo', () => {
            return {
                require: 'ngModel',
                restrict: 'A',
                link: function ($scope, elm, attrs, ctrl) {
                    const compareTo = elm.closest('form')
                        .find(`input[name="${elm.attr('w-compare-to')}"]`);
                    ctrl.$validators.wCompareTo = (val) => {
                        return val === compareTo.val();
                    };
                    compareTo.on('input', () => {
                        ctrl.$validate();
                        $scope.$apply();
                    });
                    const stop = $scope.$on('$destroy', () => {
                        stop();
                        compareTo.off();
                    });
                }
            };
        });
})();
