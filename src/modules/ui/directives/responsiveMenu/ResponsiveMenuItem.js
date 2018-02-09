(function () {
    'use strict';

    /**
     * @param Base
     * @param $element
     * @param $scope
     * @param {app.utils} utils
     * @return {ResponsiveMenuItem}
     */
    const controller = function (Base, $element, $scope, utils) {

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

                this.receive(utils.observe(this.parent, 'activeMenu'), () => {
                    $element.toggleClass('active', this.parent.activeMenu === this.value);
                });
                $element.toggleClass('active', this.parent.activeMenu === this.value);
            }

        }

        return new ResponsiveMenuItem();

    };

    controller.$inject = ['Base', '$element', '$scope', 'utils'];

    angular.module('app.ui').component('wResponsiveMenuItem', {
        template: '<div class="responsive-menu-item-content" ng-transclude></div>',
        require: { parent: '^wResponsiveMenu' },
        bindings: {
            value: '@'
        },
        transclude: true,
        controller
    });

})();
