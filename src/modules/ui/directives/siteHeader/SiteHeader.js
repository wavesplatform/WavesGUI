(function () {
    'use strict';

    const controller = function (Base) {

        class SiteHeaderCtrl extends Base {

            constructor() {
                super();
                this.hovered = false;
            }

        }

        return new SiteHeaderCtrl();
    };

    controller.$inject = ['Base'];

    angular.module('app.ui').component('wSiteHeader', {
        templateUrl: 'modules/ui/directives/siteHeader/siteHeader.html',
        controller
    });

})();
