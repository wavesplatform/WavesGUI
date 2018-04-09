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
     * @param {IPromiseControlCreate} createPromise
     * @return {Button}
     */
    const controller = function (Base, $element, $attrs, utils, createPromise) {

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
                this._canClick = true;
                /**
                 * @type {JQuery}
                 * @private
                 */
                this._$button = null;

                if ($element.attr('ng-click')) {
                    throw new Error('Wrong use w-button component! Use on-click!');
                }

                this.observe(['_disabled', '_pending'], this._currentCanClick);
                this.observe('_pending', this._togglePendingClass);
                this.observe('_canClick', utils.debounceRequestAnimationFrame(this._onChangeDisabled));
            }

            $postLink() {
                this._$button = $element.find('button:first');

                SYNC_ATTRS.forEach((name) => {
                    if (name in $attrs) {
                        this._$button.attr(name, $attrs[name]);
                    }
                });

                $element.get(0)
                    .addEventListener('click', (e) => {
                        if (!this._canClick) {
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
             * @private
             */
            _currentCanClick() {
                this._canClick = !(this._disabled || this._pending);
            }

            /**
             * @param {*} result
             * @private
             */
            _applyClick(result) {
                this._pending = true;

                const onEnd = () => {
                    if (this._pending) {
                        this._pending = false;
                    } else {
                        throw new Error('Already drop pending state!');
                    }
                };

                if (result && typeof result.then === 'function') {
                    createPromise(this, result).then(onEnd, onEnd);
                } else {
                    createPromise(this, utils.wait(DEFAULT_PENDING_TIME)).then(onEnd);
                }
            }

            /**
             * @private
             */
            _togglePendingClass() {
                this._$button.toggleClass('pending', this._pending);
            }

            /**
             * @private
             */
            _onChangeDisabled() {
                this._$button.prop('disabled', !this._canClick);
            }

        }

        return new Button();
    };

    controller.$inject = ['Base', '$element', '$attrs', 'utils', 'createPromise'];

    module.component('wButton', {
        templateUrl: 'modules/ui/directives/button/button.html',
        transclude: true,
        bindings: {
            _disabled: '<disabled',
            onClick: '&'
        },
        controller
    });

})();
