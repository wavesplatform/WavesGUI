(() => {
    'use strict';

    /**
     * @param {ng.IWindowService} $window
     * @param {ng.ITimeoutService} $timeout
     * @return {SwitchCtrl}
     */
    const controller = function ($window, $timeout) {

        class SwitchCtrl {

            constructor() {
                $timeout(() => {
                    $window.history.back();
                }, 100);
            }

        }

        return new SwitchCtrl();
    };

    controller.$inject = ['$window', '$timeout'];

    angular.module('app.switch').controller('SwitchCtrl', controller);
})();
