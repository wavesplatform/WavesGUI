(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @return {BalanceInput}
     */
    const controller = function (Base, waves) {

        class BalanceInput extends Base {

            constructor() {
                super();
                /**
                 * @type {string}
                 */
                this.name = null;
                /**
                 * @type {BigNumber}
                 */
                this.amount = null;
                /**
                 * @type {string}
                 */
                this.assetId = null;
                /**
                 * @type {Money}
                 */
                this.maxBalance = null;
                /**
                 * @type {Money}
                 */
                this.fee = null;

                this.observe('assetId', this._onChangeAssetId);
            }

            $postLink() {
                if (!this.name) {
                    throw new Error('Has no name for input!');
                }
            }

            fillMax() {
                if (this.maxBalance) {
                    if (this.fee && this.fee.asset.id === this.assetId) {
                        this.amount = this.maxBalance.getTokens().sub(this.fee.getTokens());
                    } else {
                        this.amount = this.maxBalance.getTokens();
                    }
                }
            }

            /**
             * @private
             */
            _onChangeAssetId() {
                if (!this.assetId) {
                    return null;
                }
                waves.node.assets.info(this.assetId).then((info) => {
                    this.asset = info;
                    if (!this.amount) {
                        this.amount = new BigNumber(0);
                    }
                });
            }

        }

        return new BalanceInput();
    };

    controller.$inject = ['Base', 'waves'];

    angular.module('app.ui').component('wBalanceInput', {
        bindings: {
            name: '@',
            inputClasses: '@',
            amount: '=',
            assetId: '<',
            maxBalance: '<',
            fee: '<'
        },
        scope: false,
        templateUrl: 'modules/ui/directives/balanceInput/balanceInput.html',
        transclude: false,
        controller
    });
})();
