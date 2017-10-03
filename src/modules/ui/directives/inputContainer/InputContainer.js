(function () {
    'use strict';

    /**
     * @param {JQuery} $element
     * @returns {InputContainer}
     */
    const controller = function ($element) {

        class InputContainer {

            constructor() {
                /**
                 * @type {{$touched: boolean, $error: *, $$element: JQuery}[]}
                 */
                this.target = null;
                /**
                 * @type {{$submitted: boolean}}
                 */
                this.form = null;
                /**
                 * @type {Array.<HTMLInputElement>}
                 */
                this.inputs = null;
            }

            $postLink() {
                this.inputs = $element.find('input')
                    .toArray();
                this.target = this.inputs.map((input) => {
                    return this.form[input.getAttribute('name')];
                });
            }

        }

        return new InputContainer();
    };

    controller.$inject = ['$element'];

    angular.module('app.ui')
        .component('wInputContainer', {
            transclude: true,
            bindings: {
                form: '<'
            },
            template: '<ng-transclude></ng-transclude>',
            controller
        });
})();
