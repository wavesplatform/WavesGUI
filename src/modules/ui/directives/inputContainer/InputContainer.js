(function () {
    'use strict';

    /**
     * @param {JQuery} $element
     * @return {InputContainer}
     */
    const controller = function ($element, $scope) {

        class InputContainer {

            constructor() {
                /**
                 * @type {ngModel.NgModelController[]}
                 */
                this.target = null;
                /**
                 * @type {ngForm}
                 */
                this.form = null;
                /**
                 * @type {Array.<HTMLInputElement>}
                 */
                this.inputs = null;
            }

            $postLink() {
                const name = $element.closest('form').attr('name');
                this.form = name && $scope.$parent.$eval(name);

                if (!this.form) {
                    throw new Error('Can\'t get form!');
                }

                this.inputs = $element.find('input')
                    .toArray();
                this.target = this.inputs.map((input) => {
                    return this.form[input.getAttribute('name')];
                });
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
