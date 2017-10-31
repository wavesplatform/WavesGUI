(function () {
    'use strict';

    const module = angular.module('app.ui');

    const controller = function (Base, $element, $attrs) {

        const SYNC_ATTRS = ['type', 'class'];


        class Button extends Base {

            constructor() {
                super();
                /**
                 * @type {string}
                 */
                this.type = null;
                /**
                 * @type {boolean}
                 */
                this.disabled = false;

                this.observe('disabled', this._onChangeDisabled);
            }

            $postLink() {
                const button = this._getButton();
                SYNC_ATTRS.forEach((name) => {
                    if (name in $attrs) {
                        button.attr(name, $attrs[name]);
                    }
                });

                $element.get(0)
                    .addEventListener('click', (e) => {
                        if (this.disabled) {
                            e.stopPropagation();
                            e.preventDefault();
                            e.stopImmediatePropagation();
                        }
                    }, true);
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
                this._getButton()
                    .prop('disabled', this.disabled);
            }

        }

        return new Button();
    };

    controller.$inject = ['Base', '$element', '$attrs'];

    module.component('wButton', {
        template: `<button ng-transclude></button>`,
        transclude: true,
        bindings: {
            disabled: '<',
            ngClick: '&'
        },
        controller
    });

})();
