(function () {
    'use strict';

    const controller = function ($element) {

        class InputContainer {

            constructor() {
                /**
                 * @type {{$touched: boolean, $error: *}}
                 */
                this.target = null;
                /**
                 * @type {{$submitted: boolean}}
                 */
                this.form = null;
                /**
                 * @type {JQuery}
                 */
                this.$input = null;
            }

            $postLink() {
                this.$input = $element.find('input');
                this.target = this.form[this.$input.attr('name')];
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
