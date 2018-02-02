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
                    if (feeHash[this.assetId]) {
                        this.amount = BigNumber.max(
                            this.maxBalance.getTokens().sub(feeHash[this.assetId].getTokens()),
                            new BigNumber(0)
                        );
                    } else {
                        this.amount = this.maxBalance.getTokens();
                    }
                }
            }

            _setMaxBalance() {
                if (this.fee && this.maxBalance) {
                    /**
                     * @type {Money[]}
                     */
                    const feeList = utils.toArray(this.fee);
                    const feeHash = utils.groupMoney(feeList);

                    if (feeHash[this.maxBalance.asset.id]) {
                        this.realMaxBalance = this.maxBalance.sub(feeHash[this.maxBalance.asset.id]);
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

    controller.$inject = ['Base', 'waves', '$attrs', 'utils'];

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
