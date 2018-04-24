(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {$rootScope.Scope} $scope
     * @return {InputError}
     */
    const controller = function (Base, $scope) {

        class InputError extends Base {

            constructor() {
                super();
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
                /**
                 * @type {boolean}
                 */
                this.canShow = false;
            }

            $postLink() {
                this.receive(this.inputContainer.tik, this._onTick, this);
                this.observe('canShow', this._onChangeCanShow);
            }

            /**
             * @private
             */
            _onChangeCanShow() {
                $scope.$apply();
            }

            /**
             * @param {Array<HTMLInputElement|HTMLTextAreaElement>} elements
             * @private
             */
            _onTick(elements) {
                elements.forEach((element) => {
                    const name = element.getAttribute('name');

                    if (!name) {
                        return null;
                    }

                    if (this.name && this.name !== name) {
                        return null;
                    }

                    /**
                     * @type {ngModel.NgModelController}
                     */
                    const model = this.inputContainer.form[name];

                    if (!model) {
                        return null;
                    }

                    const isFocused = element === document.activeElement;

                    const isTouchedOrSubmited = this.inputContainer.form.$submitted || model.$touched;
                    this.canShow = (!isFocused && isTouchedOrSubmited && model.$error[this.message]) || false;
                });
            }

        }

        return new InputError();
    };

    controller.$inject = ['Base', '$scope'];

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
            template: '<span class="error active" ng-if="$ctrl.canShow" ng-transclude></span>',
            controller
        });
})();
