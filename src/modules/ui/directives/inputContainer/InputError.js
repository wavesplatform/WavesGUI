(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {$rootScope.Scope} $scope
     * @param {JQuery} $element
     * @return {InputError}
     */
    const controller = function (Base, $scope, $element) {

        class InputError extends Base {

            constructor() {
                super();

                /**
                 * @type {ngModel.NgModelController|null}
                 */
                this.model = null;

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

                /**
                 * @type {number} — a number of seconds till error is hidden.
                 */
                this.hideWithin = 0;
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
                $element.toggleClass('hidden', !this.canShow);

                if (this.hideWithin) {
                    setTimeout(() => {
                        this.model.$setUntouched();
                    }, this.hideWithin * 1000);
                }
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

                    if (!this.model) {
                        this.model = model;
                    }

                    const isFocused = element === document.activeElement;
                    const pending = this.inputContainer.form.$pending || model.$pending;

                    const isTouchedOrSubmited = this.inputContainer.form.$submitted || model.$touched;
                    this.canShow = (!pending && !isFocused && isTouchedOrSubmited && model.$error[this.message]) ||
                        false;
                });
            }

        }

        return new InputError();
    };

    controller.$inject = ['Base', '$scope', '$element'];

    angular.module('app.ui')
        .component('wInputError', {
            transclude: true,
            require: {
                inputContainer: '^wInputContainer'
            },
            bindings: {
                message: '@',
                name: '@',
                hideWithin: '<?'
            },
            template: '<span class="error active" ng-if="$ctrl.canShow" ng-transclude></span>',
            controller
        });
})();
