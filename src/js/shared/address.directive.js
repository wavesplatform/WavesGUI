(function () {
    'use strict';

    angular
        .module('app.shared')
        .directive('address', ['addressService', function WavesAddressDirective(addressService) {

            return {
                require: 'ngModel',
                restrict: 'A',
                link: function (scope, element, attributes, ctrl) {
                    ctrl.$validators.address = function (modelValue, viewValue) {
                        if (ctrl.$isEmpty(viewValue))
                            return true;

                        return addressService.validateDisplayAddress(viewValue);
                    }
                }
            };
        }]);
})();
