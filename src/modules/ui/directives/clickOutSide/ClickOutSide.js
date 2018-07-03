(function () {
    'use strict';

    /**
     * @param Base
     * @param {JQuery} $element
     * @param {JQuery} $document
     * @param {$rootScope.Scope} $scope
     */
    const controller = function (Base, $element, $document, $scope) {

        class ClickOutSide extends Base {

            $postLink() {
                requestAnimationFrame(() => {
                    this.listenEventEmitter($document, 'click', (e) => {
                        const $target = $(e.target);

                        if ($target.closest($element).length === 0) {
                            this.onClickOutside({ event: e });
                            $scope.$apply();
                        }
                    });
                });
            }

        }

        return new ClickOutSide();
    };

    controller.$inject = ['Base', '$element', '$document', '$scope'];

    angular.module('app.ui').component('wClickOutside', {
        bindings: {
            onClickOutside: '&'
        },
        template: '<ng-transclude></ng-transclude>',
        transclude: true,
        controller
    });
})();
