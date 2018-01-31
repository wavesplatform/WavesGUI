(function () {
    'use strict';

    const directive = function () {
        return {
            require: 'ngModel',
            /**
             * @param $scope
             * @param {JQuery} $input
             * @param $attrs
             * @param $ngModel
             */
            link: ($scope, $input, { wCompareTo, ngModel }, $ngModel) => {

                /**
                 * $input can be both <input> and <w-input>, in the latter case we should ignore validation
                 */
                if ($input.get(0).tagName !== 'INPUT') {
                    return null;
                }

                const $compare = $input.closest('form').find(`input[name="${wCompareTo}"]`);

                if (!$compare.length) {
                    throw new Error('Element for compare not found!');
                }

                const validate = function () {
                    $ngModel.$setValidity('w-compare-to', $compare.val() === $input.val());
                };

                $compare.on('input', () => {
                    validate();
                    $scope.$apply();
                });

                $scope.$watch(ngModel, validate);
            }
        };
    };

    directive.$inject = [];

    angular.module('app.utils').directive('wCompareTo', directive);
})();
