(function () {
    'use strict';

    const controller = function (Base, $scope, $element) {

        class HelpIconController extends Base {

            constructor() {
                super();
                this.hovered = false;
            }

            hoverIn() {
                this.hovered = true;
                clearTimeout(this.timer);
                this.timer = setTimeout(() => {
                    this.hovered = false;
                    $scope.$apply();
                }, this.delay || 1000);
                $scope.$apply();
            }

            $postLink() {
                $element.on('mouseover', () => this.hoverIn());
            }

        }

        return new HelpIconController();
    };

    controller.$inject = ['Base', '$scope', '$element'];

    angular.module('app.ui').component('wHelpIcon', {
        templateUrl: 'modules/ui/directives/helpIcon/helpIcon.html',
        transclude: true,
        bindings: {
            delay: '='
        },
        controller
    });

})();
