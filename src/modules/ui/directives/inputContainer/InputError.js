(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @param {app.utils.decorators} decorators
     * @return {InputError}
     */
    const controller = function (Base, $scope, utils, decorators) {

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
                /**
                 * @type {ngModel.NgModelController}
                 */
                this._model = null;
            }

            $postLink() {
                this.observe('canShow', this._onChangeCanShow);

                this.inputContainer.onReady().then(() => {
                    if (this.name) {
                        this._model = this.inputContainer.form[this.name];

                        if (this._model) {
                            const signal = utils.observe(this._model, '$viewValue');

                            this.receive(signal, () => {
                                const element = this.inputContainer.getElementByName(this.name);
                                if (element) {
                                    this._onUserAction({ element, eventName: 'changeModelValue' });
                                }
                            });

                            signal.dispatch();
                        }
                    }

                    this.receive(this.inputContainer.userAction, this._onUserAction, this);
                });
            }

            /**
             * @private
             */
            _onChangeCanShow() {
                $scope.$digest();
            }

            /**
             * @param {InputContainer.ISignalData} data
             * @private
             */
            @decorators.async()
            _onUserAction(data) {
                const name = data.element.getAttribute('name');

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
                const isFocused = data.element === document.activeElement;

                if (!model) {
                    return null;
                }

                const isTouchedOrSubmited = this.inputContainer.form.$submitted || model.$touched;
                this.canShow = !isFocused && isTouchedOrSubmited && model.$error[this.message];
            }

        }

        return new InputError();
    };

    controller.$inject = ['Base', '$scope', 'utils', 'decorators'];

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
