(function () {
    'use strict';

    const controller = function (Base, $element) {

        class ResponsiveMenu extends Base {

            constructor() {
                super();
                this.menuList = [];
            }

            /**
             *
             * @param {ResponsiveMenuItem} item
             */
            registerItem(item) {
                this.menuList.push(item);
            }

            menuToggle() {
                $element.find('.navigation-menu').toggleClass('active');
                $element.find('.navigation-menu-overlay').toggleClass('active');
            }

            clickItem() {
                $element.find('.navigation-menu').removeClass('active');
            }

            /**
             * @param {ResponsiveMenuItem} item
             */
            setActive(item) {
                this.activeMenu = item.value;
                this.clickItem();
            }

        }

        return new ResponsiveMenu();

    };

    controller.$inject = ['Base', '$element'];

    angular.module('app.ui').component('wResponsiveMenu', {
        templateUrl: 'modules/ui/directives/responsiveMenu/responsiveMenu.html',
        bindings: {
            activeMenu: '='
        },
        transclude: true,
        controller
    });

})();
