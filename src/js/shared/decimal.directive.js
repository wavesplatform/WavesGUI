(function () {
    'use strict';

    angular
        .module('app.shared')
        .directive('decimal', function WavesDecimalDirective() {
            return {
                require: 'ngModel',
                restrict: 'A',
                link: function (scope, element, attributes, ctrl) {

                    var digits = attributes.decimal;

                    attributes.$observe('decimal', function(decimalDigits) {
                        if (isFinite(parseInt(decimalDigits)))
                            digits = decimalDigits;

                        ctrl.$validate();
                    });

                    ctrl.$validators.decimal = function (modelValue, viewValue) {
                        if (ctrl.$isEmpty(viewValue))
                            return true;

                        var maxdigits = isFinite(parseInt(digits)) ? digits : 8;
                        var regex = new RegExp('^(?:-?\\d+)?(?:\\.\\d{1,' + maxdigits + '})?$');

                        return regex.test(viewValue);
                    };
                }
            };
        });
})();
