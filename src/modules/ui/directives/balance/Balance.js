(function () {
    'use strict';

    const controller = function (Base) {

        class Balance extends Base {

            constructor() {
                super();
                /**
                 * @type {IMoney}
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
             * @param {IMoney} value
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

    angular.module('app.ui')
        .component('wBalance', {
            template: '<span w-nice-number="$ctrl.tokens" precision="$ctrl.money.asset.precision"></span>',
            bindings: {
                money: '<'
            },
            controller
        });
})();
