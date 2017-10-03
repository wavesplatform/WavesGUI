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
            }

            $postLink() {

            }

        }

        return new Checkbox();
    };

    controller.$inject = ['Base'];

    const getComponentData = (type) => {

        /**
         * @param {Array<string>} attrs
         * @returns {string}
         */
        const template = function (attrs) {
            return `<input type="checkbox" id="{{::$ctrl.id}}" ${attrs.join(' ')} class="${type}" />`;
        };

        return {
            bindings: {
                mode: '@',
                id: '@',
                ngModel: '='
            },
            template: template(['ng-checked="$ctrl.ngModel"', 'ng-class="$ctrl.mode"']),
            transclude: false,
            controller
        };
    };

    angular.module('app.ui').component('wCheckboxSubmit', getComponentData('submit'));
    angular.module('app.ui').component('wCheckboxSuccess', getComponentData('success'));
    angular.module('app.ui').component('wCheckboxSwitcher', getComponentData('switcher'));
})();
