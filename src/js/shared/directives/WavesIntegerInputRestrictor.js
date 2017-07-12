(function () {
    'use strict';

    angular
        .module('app.shared')
        .directive('integerInputRestrictor', function WavesIntegerInputRestrictor() {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function (scope, element, attributes, ngModelController) {
                    const pattern = /[^0-9]+/g;

                    function fromUser(text) {
                        if (!text) {
                            return text;
                        }

                        const transformedInput = text.replace(pattern, '');
                        if (transformedInput !== text) {
                            ngModelController.$setViewValue(transformedInput);
                            ngModelController.$render();
                        }

                        return transformedInput;
                    }

                    ngModelController.$parsers.push(fromUser);
                }
            };
        });
})();
