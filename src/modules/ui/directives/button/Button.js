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

    ['submit', 'success', ''].forEach(function (type) {

        const name = type ? type.charAt(0)
            .toUpperCase() + type.substr(1) : type;

        module.component(`wButton${name}`, {
            template: `<button class="${type}" ng-class="$ctrl.mode" ng-transclude></button>`,
            transclude: true,
            bindings: {
                mode: '@'
            },
            controller
        });

    });
})();
