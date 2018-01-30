(function () {
    'use strict';

    const controller = function (Base, $element, $scope) {

        class ResponsiveMenuItem extends Base {

            constructor() {
                super();

                /**
                 * @type {ResponsiveMenu}
                 */
                this.parent = null;
                /**
                 * @type {string}
                 */
                this.value = null;

                $element.on('click', () => {
                    this.parent.setActive(this);
                    $scope.$apply();
                });
            }

            $postLink() {
                this.parent.registerItem(this);
            }

        }

        return new ResponsiveMenuItem();

    };

    controller.$inject = ['Base', '$element', '$scope'];

    angular.module('app.ui').component('wResponsiveMenuItem', {
        template: '<div ng-class="{active: $ctrl.value === $ctrl.parent.activeMenu}" class="responsive-menu-item-content" ng-transclude></div>',
        require: { parent: '^wResponsiveMenu' },
        bindings: {
            value: '@'
        },
        transclude: true,
        controller
    });

})();
