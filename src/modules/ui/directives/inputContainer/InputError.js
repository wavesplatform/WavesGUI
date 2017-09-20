(function () {
    'use strict';

    const controller = function () {

        class InputError {

            constructor() {
                /**
                 * @type {InputContainer}
                 */
                this.inputContainer = null;
                /**
                 * @type {string}
                 */
                this.message = null;
            }

            canShow() {
                return (this.inputContainer.form.$submitted || this.inputContainer.target.$touched)
                    && this.inputContainer.target.$error[this.message];
            }

        }

        return new InputError();
    };

    controller.$inject = [];

    angular.module('app.ui')
        .component('wInputError', {
            transclude: true,
            require: {
                inputContainer: '^wInputContainer'
            },
            bindings: {
                message: '@'
            },
            template: '<div class="error" ng-class="{active: $ctrl.canShow()}"' +
            ' ng-transclude></div>',
            controller
        });
})();
