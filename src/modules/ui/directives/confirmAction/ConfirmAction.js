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

            runAction() {
                this.action();
                this.clicked = false;
            }

            removeClicked() {
                this.clicked = false;
            }

        }

        return new ConfirmAction();
    };

    controller.$inject = ['Base'];

    angular.module('app.ui').component('wConfirmAction', {
        bindings: {
            literalText: '<',
            literalConfirm: '<',
            literalBack: '<',
            literalHeader: '<',
            literalDescription: '<',
            action: '&'
        },
        templateUrl: 'modules/ui/directives/confirmAction/confirmAction.html',
        transclude: false,
        controller
    });
})();
