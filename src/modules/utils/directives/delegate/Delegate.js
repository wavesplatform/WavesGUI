(function () {
    'use strict';

    /**
     * @param Base
     * @param {JQuery} $element
     * @return {Delegate}
     */
    const controller = function (Base, $element) {

        class Delegate extends Base {

            constructor() {
                super();
                /**
                 * @type {string}
                 */
                this.event = null;
                /**
                 * @type {string}
                 */
                this.selector = null;
                /**
                 * @type {function}
                 */
                this.handler = null;

                this.observe(['event', 'selector', 'handler'], this._onChangeParams);
            }

            _onChangeParams() {
                $element.off();

                if (!this.selector || !this.handler) {
                    return null;
                }

                $element.on(this.event || 'click', this.selector, (e) => {
                    this.handler({ $event: e });
                });
            }

        }

        return new Delegate();
    };

    controller.$inject = ['Base', '$element'];

    angular.module('app.ui').component('wDelegate', {
        bindings: {
            event: '<',
            selector: '<',
            handler: '&'
        },
        template: '<ng-transclude></ng-transclude>',
        transclude: true,
        controller
    });
})();
