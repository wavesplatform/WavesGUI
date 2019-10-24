(function () {
    'use strict';

    const module = angular.module('app.ui');

    /**
     * @param {typeof Base} Base
     */
    const controller = function (Base) {

        class StepButton extends Base {

        }

        return StepButton;
    };

    controller.$inject = ['Base'];

    module.component('wStepButton', {
        bindings: {
            onStepClick: '&',
            position: '<',
            isDisabled: '<'
        },
        transclude: true,
        templateUrl: 'modules/ui/directives/stepButton/stepButton.html',
        controller
    });
})();
