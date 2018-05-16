(function () {
    'use strict';

    const COLLAPSE_DELAY = 900;

    /**
     * @param Base
     * @param $timeout
     * @param $element
     * @param $scope
     * @return {Actions}
     */
    const controller = function (Base, $timeout, $element, $scope) {

        class Actions extends Base {

            constructor() {
                super();

                /**
                 * @type {boolean}
                 */
                this.expanded = false;

                /**
                 * @type {Promise}
                 */
                this.collapseTimer = null;

                /**
                 * @type {string}
                 */
                this.DROP_DOWN_CLASS = 'actions-container';

                /**
                 * @type {boolean}
                 */
                this.openUp = false;

                this._handler = (e) => {
                    if ($(e.target).closest($element).length === 0) {
                        this.close();
                    }
                };

                this.observe('expanded', () => {
                    if (this.expanded) {
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

            toggleActions() {
                this.expanded = !this.expanded;

                if (!this.expanded) {
                    this.openUp = false;
                    return;
                }

                requestAnimationFrame(() => {
                    const dropDown = $element[0].querySelector(`.${this.DROP_DOWN_CLASS}`) || {
                        getBoundingClientRect: () => ({ bottom: 0 })
                    };
                    this.setActionsOpeningStyle(dropDown);
                    this.preventBlink(dropDown);
                });
            }

            setActionsOpeningStyle(dropDown) {
                // Adding timeout is required to wait until full drop-down rendering. This includes replacing
                // text with values for certain languages.
                setTimeout(() => {
                    const dropDownPosition = dropDown.getBoundingClientRect();
                    const bodyPosition = document.body.getBoundingClientRect();
                    if (dropDownPosition.bottom > bodyPosition.bottom) {
                        this.openUp = true;
                        $scope.$digest();
                    }
                }, 0);
            }

            preventBlink(dropDown) {
                dropDown.style.visibility = 'hidden';

                setTimeout(() => {
                    dropDown.style.visibility = '';
                }, 0);
            }

            onClick() {
                $timeout(() => {
                    this.close();
                }, 0);
            }

            onMouseLeave() {
                this.collapseTimer = $timeout(() => {
                    this.close();
                }, COLLAPSE_DELAY);
            }

            onMouseEnter() {
                $timeout.cancel(this.collapseTimer);
            }

            close() {
                this.expanded = false;
                this.openUp = false;
            }

        }

        return new Actions();
    };

    controller.$inject = ['Base', '$timeout', '$element', '$scope'];

    angular.module('app.ui').component('wActions', {
        bindings: {},
        templateUrl: 'modules/ui/directives/actions/actions.html',
        transclude: true,
        controller
    });
})();
