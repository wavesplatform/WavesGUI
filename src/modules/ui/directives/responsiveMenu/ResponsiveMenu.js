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
                $element.find('w-button.nav-toggler').removeClass('active');

                $element.find('.navigation-menu').toggleClass('active');
                // $element.find('w-button').toggleClass('active');


                if ($element.find('.navigation-menu.active w-responsive-menu-item:first .responsive-menu-item-content').hasClass('active')) {
                    $element.find('w-button.nav-toggler').removeClass('active');
                } else {
                    $element.find('w-button.nav-toggler').addClass('active');
                }
                // if ($element.find('.menu-item:first').hasClass('active')) {
                //     $element.find('.nav-toggler').addClass('active');
                //     $element.find('.navigation-menu').toggleClass('active');
                // } else {
                //     $element.find('.navigation-menu').toggleClass('active');
                // }
            }

            menuClose() {
                $element.find('.navigation-menu').removeClass('active');
                $element.find('w-button.nav-toggler').removeClass('active');
            }

            /**
             * @param {ResponsiveMenuItem} item
             */
            setActive(item) {
                this.activeMenu = item.value;
                this.menuClose();
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
