(function () {
    'use strict';

    const controller = function (Base, $scope, $element) {

        class InfoTooltipController extends Base {

            constructor() {
                super();
                this.hovered = false;
            }

            hoverIn() {
                this.hovered = true;
                clearTimeout(this.timer);
                $scope.$apply();
            }

            hoverOut() {
                clearTimeout(this.timer);
                this.timer = setTimeout(() => {
                    this.hovered = false;
                    $scope.$apply();
                }, Number(this.delay) || 1000);
            }

            $postLink() {
                $element.find('i').on('mouseover', () => this.hoverIn());
                $element.find('i').on('mouseout', () => this.hoverOut());
            }

        }

        return new InfoTooltipController();
    };

    controller.$inject = ['Base', '$scope', '$element'];

    angular.module('app.ui').component('wInfoTooltip', {
        templateUrl: 'modules/ui/directives/infoTooltip/infoTooltip.html',
        transclude: true,
        bindings: {
            delay: '=',
            noIcon: '<'
        },
        controller
    });

})();
