(function () {
    'use strict';

    const controller = function (Base, $element) {

        class Step extends Base {

            constructor() {
                super();
                this.id = null;
                /**
                 * @type {StepByStep}
                 */
                this.list = null;
            }

            $postLink() {
                this.list.registerStep(this);
                $element.attr('step', this.id);
            }

            displayToggle(state) {
                if (state) {
                    $element.show();
                } else {
                    $element.hide();
                }
            }

        }

        return new Step();
    };

    controller.$inject = ['Base', '$element'];

    angular.module('app.ui').component('wStep', {
        bindings: {
            id: '@'
        },
        require: {
            list: '^wStepByStep'
        },
        template: '<div ng-transclude></div>',
        transclude: true,
        controller
    });
})();
