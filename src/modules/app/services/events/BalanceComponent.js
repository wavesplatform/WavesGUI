(function () {
    'use strict';

    /**
     * @param EventComponent
     * @param $injector
     * @return {BalanceComponent}
     */
    const factory = function (EventComponent) {

        class BalanceComponent extends EventComponent {

            constructor(data) {
                super(data);
                /**
                 * @type string
                 */
                this.assetId = data.assetId;
                /**
                 * @type number
                 */
                this.precision = data.precision;
                /**
                 * @type {BigNumber}
                 */
                this.amount = BalanceComponent.parseAmount(data.amount);
            }

            getBalanceDifference(assetId) {
                if (this.assetId === assetId) {
                    return this.amount;
                } else {
                    return 0;
                }
            }

            toJSON() {
                return tsUtils.merge(super.toJSON(), {
                    data: {
                        amount: this.amount.toFixed(this.precision)
                    }
                });
            }

            static parseAmount(amount) {
                if (typeof amount === 'string') {
                    return new BigNumber(amount);
                } else {
                    return amount;
                }
            }
        }

        return BalanceComponent;
    };

    factory.$inject = ['EventComponent'];

    angular.module('app')
        .factory('BalanceComponent', factory);
})();
