(function () {
    'use strict';

    const controller = function (Base) {

        class Checkbox extends Base {

            constructor() {
                super();
                /**
                 * @type {string}
                 */
                this.mode = '';
                /**
                 * @type {boolean}
                 */
                this.disabled = false;
            }

        }

        return new Checkbox();
    };

    controller.$inject = ['Base', '$element'];

    const getComponentData = (type) => {

        /**
         * @param {Array<string>} attrs
         * @returns {string}
         */
        const template = function (attrs) {
            return `<input type="checkbox" id="{{::$ctrl.id}}" ${attrs.join(' ')} class="${type}">`;
        };

        return {
            bindings: {
                mode: '@',
                id: '@',
                disabled: '<',
                ngModel: '='
            },
            template: template([
                'ng-model="$ctrl.ngModel"',
                'ng-class="$ctrl.mode"',
                'ng-disabled="$ctrl.disabled"'
            ]),
            transclude: false,
            controller
        };
    };

    angular.module('app.ui').component('wCheckboxSubmit', getComponentData('submit'));
    angular.module('app.ui').component('wCheckboxSuccess', getComponentData('success'));
    angular.module('app.ui').component('wCheckboxSwitcher', getComponentData('switcher'));
})();
