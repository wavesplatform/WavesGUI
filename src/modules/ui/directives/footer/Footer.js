(function () {
    'use strict';

    const controller = function (Base) {

        class FooterCtrl extends Base {

            constructor() {
                super();
                this.hovered = false;
            }

        }

        return new FooterCtrl();
    };

    controller.$inject = ['Base'];

    angular.module('app.ui').component('wFooter', {
        templateUrl: 'modules/ui/directives/footer/footer.html',
        controller
    });

})();
