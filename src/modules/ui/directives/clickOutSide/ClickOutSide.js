(function () {
    'use strict';

    /**
     * @param Base
     * @param {JQuery} $element
     * @param {JQuery} $document
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     */
    const controller = function (Base, $element, $document, $scope, utils) {

        class ClickOutSide extends Base {

            $postLink() {
                requestAnimationFrame(() => {
                    this.listenEventEmitter($document, 'click', (e) => {
                        const $target = $(e.target);

                        if ($target.closest($element).length === 0) {
                            this.onClickOutside({ event: e });
                            utils.safeApply($scope);
                        }
                    });
                });
            }

        }

        return new ClickOutSide();
    };

    controller.$inject = ['Base', '$element', '$document', '$scope', 'utils'];

    angular.module('app.ui').component('wClickOutside', {
        bindings: {
            onClickOutside: '&'
        },
        template: '<ng-transclude></ng-transclude>',
        transclude: true,
        controller
    });
})();
