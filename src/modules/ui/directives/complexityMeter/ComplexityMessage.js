(function () {
    'use strict';

    const controller = function (Base) {

        class ComplexityMessage extends Base {

            constructor() {
                super();
                this.message = null;
                this.validators = null;
            }

            $postLink() {
                this.validators = (this.message || '').split(',')
                    .map((item) => item.trim())
                    .filter(Boolean);

                if (!this.validators.length) {
                    throw new Error('Has no message');
                }
            }

        }

        return new ComplexityMessage();
    };

    controller.$inject = ['Base'];

    angular.module('app.ui').component('complexityMessage', {
        controller,
        require: {
            parent: '^wComplexityMeter'
        },
        bindings: {
            message: '@'
        }
    });
})();
