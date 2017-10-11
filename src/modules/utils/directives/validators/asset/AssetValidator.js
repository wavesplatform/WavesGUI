(function () {
    'use strict';

    /**
     * @param {AssetsService} assetsService
     * @param {app.utils} utils
     * @return {{require: string, link: (function(*, *, *, *=))}}
     */
    const directive = function (assetsService, utils) {

        return {
            require: 'ngModel',
            /**
             * @param {$rootScope.Scope} $scope
             * @param {object} {JQuery} $input
             * @param $attrs
             * @param {ngModel.NgModelController} $ctrl
             */
            link: ($scope, $input, $attrs, $ctrl) => {
                if (!$attrs.inputAsset) {
                    throw new Error('Has no asset id for input validation!');
                }

                if ($input.get(0).tagName !== 'INPUT') {
                    return null;
                }

                assetsService.getAssetInfo($attrs.inputAsset)
                    .then((asset) => {

                        /**
                         * @param {number} modelValue
                         * @param {string} viewValue
                         * @return {boolean}
                         */
                        const isValid = function (modelValue, viewValue) {
                            const parts = String(viewValue || 0)
                                .replace(',', '.')
                                .split('.');
                            const quantity = asset.quantity || Number.MAX_VALUE;
                            return modelValue < quantity && (!parts[1] || parts[1].length <= asset.precision);
                        };

                        /**
                         * @type {boolean}
                         */
                        const isRequired = $input.get(0)
                            .hasAttribute('required');

                        /**
                         * @param {number} value
                         * @return {boolean}
                         */
                        const hasValue = function (value) {
                            return !isRequired || !!value;
                        };

                        /**
                         * @param {number} modelValue
                         * @param {string} viewValue
                         */
                        const validate = function (modelValue, viewValue) {
                            $ctrl.$setValidity('input-asset', isValid(modelValue, viewValue));
                            $ctrl.$setValidity('asset-required', hasValue(modelValue));
                        };

                        $scope.$watch($attrs.ngModel, () => {
                            const value = $input.val();
                            validate(utils.parseNiceNumber(value), value);
                        });

                        $ctrl.$parsers.unshift((value) => {
                            const parsed = utils.parseNiceNumber(value);
                            validate(parsed, value);
                            return parsed;
                        });

                        $ctrl.$formatters.unshift((value) => utils.getNiceNumber(value, asset.precision));

                        const value = $input.val();
                        validate(utils.parseNiceNumber(value), value);
                    });
            }
        };
    };

    directive.$inject = ['assetsService', 'utils'];

    angular.module('app.utils')
        .directive('inputAsset', directive);
})();
