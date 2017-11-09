(function () {
    'use strict';

    const controller = function (Base, $element) {

        class ComplexityMessage extends Base {

            constructor() {
                super();
                /**
                 * @type {string}
                 */
                this.message = null;
                /**
                 * @type {string}
                 */
                this.type = null;
                /**
                 * @type {string[]}
                 */
                this.validators = null;
                /**
                 * @type {ComplexityMeter}
                 */
                this.parent = null;
                /**
                 * @type {boolean}
                 */
                this.show = false;

                this.observe('show', this._onChangeShow);
                this._onChangeShow();
            }

            $postLink() {
                if (this.type) {
                    switch (this.type) {
                        case 'warn':
                            this.parent.addWarn(this);
                            break;
                        case 'success':
                            this.parent.addSuccess(this);
                            break;
                        default:
                            throw new Error('Wrong message type!');
                    }
                    return null;
                }
                this.validators = (this.message || '').split(',')
                    .map((item) => item.trim())
                    .filter(Boolean);

                if (!this.validators.length) {
                    throw new Error('Has no message');
                }
                this.parent.addMessage(this);
            }

            _onChangeShow() {
                $element.toggleClass('hidden', !this.show);
            }

        }

        return new ComplexityMessage();
    };

    controller.$inject = ['Base', '$element'];

    angular.module('app.ui').component('complexityMessage', {
        controller,
        require: {
            parent: '^wComplexityMeter'
        },
        bindings: {
            message: '@',
            type: '@'
        }
    });
})();
