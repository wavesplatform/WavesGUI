(function () {
    'use strict';

    const module = angular.module('app.ui');

    const controller = function ($element, $attrs) {

        class Button {

            constructor() {
                /**
                 * @type {string}
                 */
                this.type = null;
                /**
                 * @type {string}
                 */
                this.mode = '';
            }

            $postLink() {
                if ($attrs.type) {
                    $element.find('button:first').attr('type', $attrs.type);
                }
            }

        }

        return new Button();
    };

    controller.$inject = ['$element', '$attrs'];

    module.component('wButtonSubmit', {
        template: '<button class="submit" ng-class="$ctrl.mode" ng-transclude></button>',
        transclude: true,
        bindings: {
            mode: '@'
        },
        controller
    });

    module.component('wButtonSuccess', {
        template: '<button class="success" ng-class="$ctrl.mode" ng-transclude></button>',
        transclude: true,
        bindings: {
            mode: '@'
        },
        controller
    });

    module.component('wButton', {
        template: '<button ng-class="$ctrl.mode" ng-transclude></button>',
        transclude: true,
        bindings: {
            mode: '@'
        },
        controller
    });

})();
