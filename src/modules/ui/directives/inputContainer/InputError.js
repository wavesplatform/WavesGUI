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
                /**
                 * @type {string}
                 */
                this.name = null;
            }

            canShow() {
                return (this.inputContainer.form.$submitted || this._isTouched()) && this._hasError();
            }

            _isTouched() {
                return this.name != null ? this.inputContainer.form[this.name].$touched :
                    this._getTarget().some((item) => item.$touched);
            }

            _hasError() {
                return this.name != null ? this.inputContainer.form[this.name].$error[this.message] :
                    this._getTarget().some((item) => item.$error[this.message]);
            }

            _getTarget() {
                return this.inputContainer.target.filter((item) => item.$$element.get(0) !== document.activeElement);
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
                message: '@',
                name: '@'
            },
            template: '<div class="error" ng-class="{active: $ctrl.canShow()}"' +
            ' ng-transclude></div>',
            controller
        });
})();
