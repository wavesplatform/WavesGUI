(function () {
    'use strict';

    const module = angular.module('app.ui');

    const controller = function (Base, $element, $attrs) {

        class Button extends Base {

            constructor() {
                super();
                /**
                 * @type {string}
                 */
                this.type = null;
                /**
                 * @type {string}
                 */
                this.mode = '';
                /**
                 * @type {boolean}
                 */
                this.disabled = false;

                this.observe('disabled', this._onChangeDisabled);
            }

            $postLink() {
                if ($attrs.type) {
                    this._getButton().attr('type', $attrs.type);
                }

                $element.get(0).addEventListener('click', (e) => {
                    if (this.disabled) {
                        e.stopPropagation();
                        e.preventDefault();
                        e.stopImmediatePropagation();
                    }
                }, true);

                this._onChangeDisabled();
            }

            /**
             * @return {JQuery}
             * @private
             */
            _getButton() {
                return $element.find('button:first');
            }

            /**
             * @private
             */
            _onChangeDisabled() {
                this._getButton().prop('disabled', this.disabled);
            }

        }

        return new Button();
    };

    controller.$inject = ['Base', '$element', '$attrs', '$q'];

    const getButtonContent = (type) => ({
        template: `<button class="${type}" ng-class="$ctrl.mode" ng-transclude></button>`,
        transclude: true,
        bindings: {
            mode: '@',
            disabled: '<',
            ngClick: '&'
        },
        controller
    });

    module.component('wButtonSubmit', getButtonContent('submit'));
    module.component('wButtonSuccess', getButtonContent('success'));
    module.component('wButton', getButtonContent(''));

})();
