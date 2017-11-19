(function () {
    'use strict';

    const COLLAPSE_DELAY = 900;

    /**
     * @param Base
     * @param $timeout
     * @return {Actions}
     */
    const controller = function (Base, $timeout) {

        class Actions extends Base {

            constructor() {
                super();
                this.expanded = false;
                this.collapseTimer = null;
            }

            onClick() {
                $timeout(() => {
                    this.expanded = false;
                }, 0);
            }

            onMouseLeave() {
                this.collapseTimer = $timeout(() => {
                    this.expanded = false;
                }, COLLAPSE_DELAY);
            }

            onMouseEnter() {
                $timeout.cancel(this.collapseTimer);
            }

        }

        return new Actions();
    };

    controller.$inject = ['Base', '$timeout'];

    angular.module('app.ui').component('wActions', {
        bindings: {},
        templateUrl: 'modules/ui/directives/actions/actions.html',
        transclude: true,
        controller
    });
})();
