(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @return {BalanceInput}
     */
    const controller = function (Base, waves, $attrs) {

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
                /**
                 * @type {Money}
                 */
                this.realMaxBalance = null;
                /**
                 * @type {function}
                 */
                this.fillMax = null;

                this.observe('assetId', this._onChangeAssetId);
                this.observe(['fee', 'maxBalance'], () => {
                    this.realMaxBalance = this.fee &&
                    this.maxBalance &&
                    this.fee.asset.id === this.maxBalance.asset.id ?
                        this.maxBalance.sub(this.fee) : this.maxBalance
                })
            }

            $postLink() {
                if (!this.name) {
                    throw new Error('Has no name for input!');
                }
            }

            fillMaxClick() {
                if ($attrs.fillMax) {
                    this.fillMax();
                    return null;
                }
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

    controller.$inject = ['Base', 'waves', '$attrs'];

    angular.module('app.ui').component('wBalanceInput', {
        bindings: {
            name: '@',
            inputClasses: '@',
            fillMax: '&',
            amount: '=',
            assetId: '<',
            maxBalance: '<',
            fee: '<',
            min: '<'
        },
        scope: false,
        templateUrl: 'modules/ui/directives/balanceInput/balanceInput.html',
        transclude: false,
        controller
    });
})();
