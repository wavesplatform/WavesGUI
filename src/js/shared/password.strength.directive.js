(function () {
    'use strict';

    angular
        .module('app.shared')
        .directive('passwordStrength', function WavesPasswordStrengthDirective() {

            return {
                require: 'ngModel',
                restrict: 'A',
                link: function (scope, element, attributes, ctrl) {
                    ctrl.$validators.passwordStrength = function (modelValue, viewValue) {
                        if (ctrl.$isEmpty(viewValue))
                            return true;

                        var containsDigits = /[0-9]/.test(viewValue);
                        var containsUppercase = /[A-Z]/.test(viewValue);
                        var containsLowercase = /[a-z]/.test(viewValue);

                        return containsDigits && containsUppercase && containsLowercase;
                    };
                }
            };
        });
})();
