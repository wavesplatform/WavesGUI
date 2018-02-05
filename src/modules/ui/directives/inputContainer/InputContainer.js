(function () {
    'use strict';

    /**
     * @param {JQuery} $element
     * @return {InputContainer}
     */
    const controller = function ($element, $scope) {

        class InputContainer {

            /**
             * @type {Array.<HTMLInputElement>}
             */
            get inputs() {
                return $element.find('input,textarea')
                    .toArray();
            }

            /**
             * @type {ngModel.NgModelController[]}
             */
            get target() {
                return this.inputs.map((input) => {
                    return this.form[input.getAttribute('name')];
                });
            }

            constructor() {
                /**
                 * @type {ngForm}
                 */
                this.form = null;
            }

            $postLink() {
                const name = $element.closest('form').attr('name');
                this.form = name && $scope.$parent.$eval(name);

                if (!this.form) {
                    throw new Error('Can\'t get form!');
                }

            }

        }

        return new InputContainer();
    };

    controller.$inject = ['$element', '$scope'];

    angular.module('app.ui')
        .component('wInputContainer', {
            transclude: true,
            template: '<ng-transclude></ng-transclude>',
            controller
        });
})();
