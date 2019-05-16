(function () {
    'use strict';

    const controller = function (Base) {

        class GetStartedLinkCtrl extends Base {

            constructor() {
                super();
                this.hovered = false;
            }

        }

        return new GetStartedLinkCtrl();
    };

    controller.$inject = ['Base'];

    angular.module('app.ui').component('wGetStartedLink', {
        templateUrl: 'modules/ui/directives/getStartedLink/getStartedLink.html',
        controller
    });

})();
