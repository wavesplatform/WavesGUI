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

            /**
             * @return {boolean}
             * @private
             */
            _isTouched() {
                return this._getElements()
                    .filter((item) => item.$touched && item.$invalid)
                    .some((item) => item.$touched);
            }

            /**
             * @return {boolean}
             * @private
             */
            _hasError() {
                return this._getElements().some((item) => item.$error[this.message]);
            }

            /**
             * @private
             */
            _getElements() {
                const empty = tsUtils.isEmpty(this.name);

                return !empty ? [this.inputContainer.form[this.name].$touched] :
                    this._getTarget();
            }

            /**
             * @return {Array.<{$touched: boolean, $error: *, $$element: JQuery}>}
             * @private
             */
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
            template: '<span class="error" ng-class="{active: $ctrl.canShow()}"' +
            ' ng-transclude></span>',
            controller
        });
})();
