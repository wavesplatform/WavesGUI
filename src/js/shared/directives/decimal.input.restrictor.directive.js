(function () {
    'use strict';

    angular
        .module('app.shared')
        .directive('decimalInputRestrictor', [function WavesDecimalInputRestrictorDirective() {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function (scope, element, attributes, ngModelController) {
                    var pattern = /[^0-9.]+/g;

                    function fromUser (text) {
                        if (!text)
                            return text;

                        var transformedInput = text.replace(pattern, '');
                        if (transformedInput !== text) {
                            ngModelController.$setViewValue(transformedInput);
                            ngModelController.$render();
                        }

                        return transformedInput;
                    }

                    ngModelController.$parsers.push(fromUser);
                }
            };
        }]);
})();
