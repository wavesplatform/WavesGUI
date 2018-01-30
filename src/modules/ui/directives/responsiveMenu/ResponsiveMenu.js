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
                if ($element.find('.menu-item:first').hasClass('active')) {
                    $element.find('w-button').addClass('dotsBlue');
                    $element.find('.navigation-menu').toggleClass('active');
                } else {
                    $element.find('.navigation-menu').toggleClass('active');
                }
            }

            /**
             * @param {ResponsiveMenuItem} item
             */
            setActive(item) {
                this.activeMenu = item.value;
                this.menuToggle();
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
