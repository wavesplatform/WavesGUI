(function () {
    'use strict';

    const DEFAULT_PENDING_TIME = 700;
    const module = angular.module('app.ui');

    /**
     *
     * @param Base
     * @param $element
     * @param $attrs
     * @param {app.utils} utils
     * @return {Button}
     */
    const controller = function (Base, $element, $attrs, utils) {

        const SYNC_ATTRS = ['type', 'class'];


        class Button extends Base {

            constructor() {
                super();

                /**
                 * @type {boolean}
                 * @private
                 */
                this._disabled = false;
                /**
                 * @type {boolean}
                 * @private
                 */
                this._pending = false;
                /**
                 * @type {boolean}
                 * @private
                 */
                this._canClick = false;

                if ($element.attr('ng-click')) {
                    throw new Error('Wrong use w-button component! Use on-click!');
                }

                this.observe(['_disabled', '_pending'], this._currentCanClick);
                this.observe('_canClick', utils.debounceRequestAnimationFrame(this._onChangeDisabled));
            }

            _currentCanClick() {
                this._canClick = this._disabled || this._pending;
            }

            $postLink() {
                const button = this._getButton();
                SYNC_ATTRS.forEach((name) => {
                    if (name in $attrs) {
                        button.attr(name, $attrs[name]);
                    }
                });

                this._getButton().get(0)
                    .addEventListener('click', (e) => {
                        if (this.disabled || this.pending) {
                            e.stopPropagation();
                            e.preventDefault();
                            e.stopImmediatePropagation();
                        } else {
                            const result = this.onClick({ $event: e });
                            this._applyClick(result);
                        }
                    }, false);
            }

            /**
             * @param result
             * @private
             */
            _applyClick(result) {
                const $button = this._getButton();
                $button.toggleClass('pending', true);
                this._pending = true;

                const onEnd = () => {
                    if (this._pending) {
                        this._pending = false;
                    } else {
                        throw new Error('Already drop pending state!');
                    }
                    $button.toggleClass('pending', false);
                };

                if (result && typeof result.then === 'function') {
                    result.then(onEnd, onEnd);
                } else {
                    utils.wait(DEFAULT_PENDING_TIME).then(onEnd);
                }
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
                    .prop('disabled', this._canClick);
            }

        }

        return new Button();
    };

    controller.$inject = ['Base', '$element', '$attrs', 'utils'];

    module.component('wButton', {
        templateUrl: 'modules/ui/directives/button/button.html',
        transclude: true,
        bindings: {
            disabled: '<',
            onClick: '&'
        },
        controller
    });

})();
