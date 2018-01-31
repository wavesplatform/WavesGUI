(function () {
    'use strict';

    const AVAILABLE_VALIDATORS = [
        'gt',
        'gte',
        'lt',
        'lte',
        'length',
        'precision',
        'byte'
    ];

    function getAttrName(validatorName) {
        return `wValidator${validatorName.charAt(0).toUpperCase()}${validatorName.slice(1)}`;
    }

    AVAILABLE_VALIDATORS.forEach((name) => {
        const attrName = getAttrName(name);

        const directive = function (utils, validateService) {
            return {
                require: 'ngModel',
                /**
                 * @param $scope
                 * @param {JQuery} $input
                 * @param $attrs
                 * @param $ngModel
                 */
                link: ($scope, $input, $attrs, $ngModel) => {

                    /**
                     * $input can be both <input> and <w-input>, in the latter case we should ignore validation
                     */
                    if ($input.get(0).tagName !== 'INPUT') {
                        return null;
                    }

                    let value = null;
                    const exp = $attrs[attrName];

                    const validate = function () {
                        const valid = validateService[name]($ngModel.$modelValue, value);
                        $ngModel.$setValidity(name, valid);
                    };

                    $scope.$watch(exp, (newValue) => {
                        value = newValue;
                        validate();
                    });

                    $scope.$watch($attrs.ngModel, validate);
                }
            };
        };

        directive.$inject = ['utils', 'validateService'];

        angular.module('app.utils').directive(attrName, directive);
    });

})();

