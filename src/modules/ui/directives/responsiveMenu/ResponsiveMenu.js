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
                $element.find('.responsive-menu-item-content').closest('w-responsive-menu-item').removeClass('menu-item-to-top');
                $element.find('.responsive-menu-item-content.active').closest('w-responsive-menu-item').addClass('menu-item-to-top');
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

    }

    angular.module('app.ui').component('wResponsiveMenu', {
        templateUrl: 'modules/ui/directives/responsiveMenu/responsiveMenu.html',
        bindings: {
            activeMenu: '='
        },
        transclude: true,
        controller
    });

})();
