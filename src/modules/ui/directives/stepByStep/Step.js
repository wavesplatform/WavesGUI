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
                this.state = false;
            }

            $postLink() {
                this.list.registerStep(this);
                $element.attr('step', this.id);
            }

            displayToggle(state) {
                this.state = state;
            }

        }

        return new Step();
    };

    controller.$inject = ['Base', '$element'];

    angular.module('app.ui').component('wStep', {
        bindings: {
            id: '@stepId'
        },
        require: {
            list: '^wStepByStep'
        },
        template: '<div ng-if="$ctrl.state" ng-transclude></div>',
        transclude: true,
        controller
    });
})();
