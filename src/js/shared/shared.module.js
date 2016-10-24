(function() {
    'use strict';

    angular
        .module('app.shared', [])
        .config(['$validatorProvider', 'notificationService', function ($validatorProvider, notificationService) {
            $validatorProvider.setDefaults({
                errorClass: 'wInput-error',
                onkeyup: false,
                showErrors : function(errorMap, errorList) {
                    errorList.forEach(function(error) {
                        notificationService.error(error.message);
                    });

                    var i, elements;
                    for (i = 0, elements = this.validElements(); elements[i]; i++) {
                        angular.element(elements[i]).removeClass(this.settings.errorClass);
                    }

                    for (i = 0, elements = this.invalidElements(); elements[i]; i++) {
                        angular.element(elements[i]).addClass(this.settings.errorClass);
                    }
                }
            });

            $validatorProvider.addMethod('address', function(value, element){
                return this.optional(element) || Waves.Addressing.validateDisplayAddress(value);
            }, "Account number must be a sequence of 35 alphanumeric characters with no spaces, optionally starting with '1W'");
            $validatorProvider.addMethod('decimal', function(value, element, params) {
                var maxdigits = angular.isNumeric(params) ? params : Currency.WAV.precision;

                var regex = new RegExp("^(?:-?\\d+)?(?:\\.\\d{1," + maxdigits + "})?$");
                return this.optional(element) || regex.test(value);
            }, "Amount is expected with a dot (.) as a decimal separator with no more than {0} fraction digits");
            $validatorProvider.addMethod('password', function(value, element){
                if (this.optional(element))
                    return true;

                var containsDigits = /[0-9]/.test(value);
                var containsUppercase = /[A-Z]/.test(value);
                var containsLowercase = /[a-z]/.test(value);

                return containsDigits && containsUppercase && containsLowercase;
            }, "The password is too weak. A good password must contain at least one digit, one uppercase and one lowercase letter");
        }]);
})();
