(function () {
    'use strict';

    const controller = function ($attrs) {

        class ConfirmTransaction {

            constructor() {
                this.locale = $attrs.locale || 'app.ui';
            }

        }

        return new ConfirmTransaction();
    };

    controller.$inject = ['$attrs'];

    angular.module('app.ui').component('wConfirmTransaction', {
        bindings: {
            tx: '<',
            onClickBack: '&'
        },
        templateUrl: 'modules/ui/directives/confirmTransaction/template.html',
        transclude: false,
        controller
    });
})();
