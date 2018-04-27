(function () {
    'use strict';

    const controller = function (Base) {

        class Balance extends Base {

            constructor() {
                super();
                /**
                 * @type {Money}
                 */
                this.money = null;
                /**
                 * @type {BigNumber}
                 */
                this.tokens = null;

                this.observe('money', this._onChangeMoney, {
                    set: function (val) {
                        return val || null;
                    }
                });
            }

            /**
             * @param {Money} value
             * @private
             */
            _onChangeMoney({ value }) {
                if (value) {
                    this.tokens = value.getTokens();
                } else {
                    this.tokens = null;
                }
            }

        }

        return new Balance();
    };

    controller.$inject = ['Base'];

    const attrs = [
        'w-nice-number="$ctrl.tokens"',
        'short-mode="$ctrl.shortMode"',
        'precision="$ctrl.money.asset.precision"'
    ];

    angular.module('app.ui')
        .component('wBalance', {
            template: `<span ${attrs.join(' ')}></span>`,
            bindings: {
                money: '<',
                shortMode: '<'
            },
            controller
        });
})();
