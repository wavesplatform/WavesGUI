(function () {
    'use strict';

    const COLLAPSE_DELAY = 900;

    /**
     * @param Base
     * @param $timeout
     * @return {Actions}
     */
    const controller = function (Base, $timeout, $element) {

        class Actions extends Base {

            constructor() {
                super();
                this.expanded = false;
                this.collapseTimer = null;

                this._handler = (e) => {
                    if ($(e.target).closest($element).length === 0) {
                        this.expanded = false;
                    }
                };

                this.observe('expanded', () => {
                    const expanded = this.expanded;

                    if (expanded) {
                        $(document).on('mousedown', this._handler);
                    } else {
                        $(document).off('mousedown', this._handler);
                    }
                });
            }

            $onDestroy() {
                super.$onDestroy();
                $(document).off('mousedown', this._handler);
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

    controller.$inject = ['Base', '$timeout', '$element'];

    angular.module('app.ui').component('wActions', {
        bindings: {},
        templateUrl: 'modules/ui/directives/actions/actions.html',
        transclude: true,
        controller
    });
})();
