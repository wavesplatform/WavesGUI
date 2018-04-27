(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @param {object} $attrs
     * @param {app.utils} utils
     * @return {BalanceInput}
     */
    const controller = function (Base, waves, $attrs, utils) {

        class BalanceInput extends Base {


            constructor() {
                super();
                /**
                 * @type {string}
                 */
                this.name = null;
                /**
                 * @type {boolean}
                 */
                this.focus = false;
                /**
                 * @type {Money}
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
                 * @type {Money|Array<Money>}
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
                this.observe(['fee', 'maxBalance'], this._setMaxBalance);
                this.observe('focus', () => {
                    if (this.focus) {
                        this.onFocus();
                    } else {
                        this.onBlur();
                    }
                });
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

                    const feeHash = utils.groupMoney(utils.toArray(this.fee));
                    let amount = null;

                    if (feeHash[this.assetId]) {
                        amount = this.maxBalance.sub(feeHash[this.assetId]);
                    } else {
                        amount = this.maxBalance;
                    }

                    if (amount.getTokens().lt(0)) {
                        this.amount = this.maxBalance.cloneWithTokens('0');
                    } else {
                        this.amount = amount;
                    }
                }
            }

            /**
             * @private
             */
            _setMaxBalance() {
                if (this.fee && this.maxBalance) {
                    /**
                     * @type {Money[]}
                     */
                    const feeList = utils.toArray(this.fee);
                    const feeHash = utils.groupMoney(feeList);

                    if (feeHash[this.maxBalance.asset.id]) {
                        const max = this.maxBalance.sub(feeHash[this.maxBalance.asset.id]);
                        if (max.getTokens().lt(0)) {
                            this.realMaxBalance = this.maxBalance.cloneWithTokens('0');
                        } else {
                            this.realMaxBalance = max;
                        }
                    } else {
                        this.realMaxBalance = this.maxBalance;
                    }
                } else {
                    this.realMaxBalance = this.maxBalance;
                }
            }

            /**
             * @private
             */
            _onChangeAssetId() {
                if (!this.assetId) {
                    return null;
                }
                Waves.Money.fromTokens('0', this.assetId).then((money) => {
                    this.asset = money.asset;
                    if (!this.amount) {
                        this.amount = money;
                    }
                });
            }

        }

        return new BalanceInput();
    };

    controller.$inject = ['Base', 'waves', '$attrs', 'utils'];

    angular.module('app.ui').component('wBalanceInput', {
        bindings: {
            name: '@',
            inputClasses: '@',
            fillMax: '&',
            onFocus: '&',
            onBlur: '&',
            amount: '=',
            assetId: '<',
            maxBalance: '<',
            fee: '<',
            min: '<'
        },
        scope: false,
        templateUrl: 'modules/ui/directives/balanceInput/balanceInput.html',
        controller
    });
})();
