(function () {
    'use strict';

    const controller = function (Base) {

        class ConfirmAction extends Base {

            $postLink() {
                this.clicked = false;
            }

            onClickAction() {
                this.clicked = true;
            }

        }

        return new ConfirmAction();
    };

    controller.$inject = ['Base'];

    angular.module('app.ui').component('wConfirmAction', {
        bindings: {
            literalText: '<',
            literalConfirm: '<',
            action: '&'
        },
        templateUrl: 'modules/ui/directives/confirmAction/confirmAction.html',
        transclude: false,
        controller
    });
})();
