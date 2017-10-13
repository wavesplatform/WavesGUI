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

                /**
                 * $input can be both <input> and <w-input>, in the latter case we should ignore validation
                 */
                if ($input.get(0).tagName !== 'INPUT') {
                    return null;
                }

                const numberReg = /[0-9]/;

                const filterValue = function (value) {
                    value = String(value);
                    const dotIndex = getDotIndex(value);
                    return value.split('')
                        .filter((char, i) => checkChar(char, i > dotIndex))
                        .join('');
                };

                /**
                 * @param {string} value
                 * @return {number}
                 */
                const getDotIndex = function (value) {
                    const index = value.indexOf('.');
                    if (index === -1) {
                        return Number.MAX_VALUE;
                    } else {
                        return index;
                    }
                };

                /**
                 * @param {string} char
                 * @param {boolean} hasDot
                 * @return {boolean}
                 */
                const checkChar = (char, hasDot) => {
                    if (char === '.') {
                        return !hasDot;
                    } else {
                        return numberReg.test(char);
                    }
                };

                $input.on('keypress', (event) => {
                    function getChar(event) {
                        if (event.which === null) { // IE
                            if (event.keyCode < 32) return null; // спец. символ
                            return String.fromCharCode(event.keyCode);
                        }

                        if (event.which !== 0 && event.charCode !== 0) { // все кроме IE
                            if (event.which < 32) return null; // спец. символ
                            return String.fromCharCode(event.which); // остальные
                        }

                        return null; // спец. символ
                    }

                    const char = getChar(event);
                    if (!char || !checkChar(char, $input.val().indexOf('.') !== -1)) {
                        event.preventDefault();
                    }
                });

                $scope.$watch($attrs.ngModel, () => {
                    $input.val(filterValue($input.val()));
                });

                $ctrl.$parsers.push((value) => {
                    const parsed = utils.parseNiceNumber(value);
                    return parsed;
                });
            }
        };
    };

    directive.$inject = ['assetsService', 'utils'];

    angular.module('app.utils')
        .directive('inputAsset', directive);
})();
