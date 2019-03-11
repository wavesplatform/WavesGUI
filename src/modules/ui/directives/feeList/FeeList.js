(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {Waves} waves
     * @param {User} user
     * @param {$rootScope.Scope} $scope
     */
    const controller = function (Base, waves, $scope, user) {

        class FeeList extends Base {

            /**
             * @type {*}
             */
            tx = null;
            /**
             * @type {Money}
             */
            fee = null;
            /**
             * @type {Array<Money>}
             */
            feeList = [];
            /**
             * @type {Object.<string, Money>}
             */
            balanceHash = null;


            constructor() {
                super();
                $scope.$watch('$ctrl.tx', () => this._onChangeTx(), true);
                this.observe('balanceHash', this._onChangeBalanceHash);
            }

            /**
             * @return {null}
             * @private
             */
            _onChangeTx() {
                if (!this.tx) {
                    return null;
                }
                this.tx.attachment = this.tx.attachment.toString();
                waves.node.getFeeList(this.tx).then(list => {

                    this.originalFeeList = list;
                    this._setActualFeeList();

                    const isEqualAssetId = (asset1, asset2) => asset1.id === asset2.id;
                    const isEqualMoney = (money1, money2) =>
                        isEqualAssetId(money1.asset, money2.asset) && money1.eq(money2);

                    const hasMyFeeInList = this.fee && list.some(item => isEqualMoney(item, this.fee));
                    if (!hasMyFeeInList) {
                        this.fee = null;
                    }

                    if (!(this.fee && list.find(item => item.asset.id === this.fee.asset.id))) {
                        const fee = this.balanceHash && Object.keys(this.balanceHash).length && this.feeList
                            .find(item => {
                                const balance = this.balanceHash[item.asset.id];
                                return balance && balance.gte(item);
                            });
                        this.fee = fee || this.feeList[0];
                    }

                    $scope.$apply();
                });
            }

            /**
             * @return {null}
             * @private
             */
            _onChangeBalanceHash() {
                if (!this.fee) {
                    return null;
                }

                this._setActualFeeList();

                if (this.feeList.length === 1) {
                    return null;
                }

                const feeBalance = this.balanceHash[this.fee.asset.id];

                if (!feeBalance || feeBalance.lt(this.fee)) {
                    this.fee = this.balanceHash && Object.keys(this.balanceHash).length && this.feeList.find(item => {
                        const balance = this.balanceHash[item.asset.id];
                        return balance && balance.gte(item);
                    }) || this.fee;
                }
            }

            /**
             * @param {Array<Money>} list
             * @return {null}
             * @private
             */
            _setActualFeeList(list = this.originalFeeList) {
                const hasBalances = this.balanceHash && Object.keys(this.balanceHash).length;

                if (!list || list.length < 2 || !hasBalances) {
                    this.feeList = [...(list || [])];
                    return null;
                }

                const wavesFee = list.find(item => item.asset.id === 'WAVES');
                const filteredList = list.filter(fee => {
                    const feeBalance = this.balanceHash[fee.asset.id];
                    const canUseOwnFee = user.address !== fee.asset.sender || this.balanceHash.WAVES.gte(wavesFee);
                    return hasBalances && feeBalance && feeBalance.gte(fee) && canUseOwnFee;
                });


                if (!filteredList.length) {
                    filteredList.push(wavesFee);
                }

                this.feeList = filteredList;
            }

        }

        return new FeeList();
    };

    controller.$inject = ['Base', 'waves', '$scope', 'user'];

    angular.module('app.ui').component('wFeeList', {
        bindings: {
            tx: '<',
            balanceHash: '<',
            disabled: '<',
            fee: '='
        },
        scope: false,
        transclude: false,
        templateUrl: 'modules/ui/directives/feeList/feeList.html',
        controller
    });

})();
