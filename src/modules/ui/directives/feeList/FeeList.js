(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {Waves} waves
     */
    const controller = function (Base, waves) {

        const { find } = require('ts-utils');

        class FeeList extends Base {

            /**
             * @type {number}
             */
            type = null;
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
                this.observe('type', this._onChangeTxType);
                this.observe('balanceHash', this._onChangeBalanceHash);
            }

            _onChangeTxType() {
                if (!this.type) {
                    return null;
                }

                waves.node.getFeeList({ type: this.type }).then(list => {
                    this.originalFeeList = list;
                    this._setActualFeeList();
                    if (!(this.fee && find(this.feeList, item => item.asset.id === this.fee.asset.id))) {
                        const fee = this.balanceHash && Object.keys(this.balanceHash).length && list.find(item => {
                            const balance = this.balanceHash[item.asset.id];
                            return balance && balance.gte(item);
                        });
                        this.fee = fee || this.feeList[0];
                    }

                });
            }

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

            _setActualFeeList(list = this.originalFeeList) {
                const hasBalances = this.balanceHash && Object.keys(this.balanceHash).length;

                if (!list || list.length < 2 || !hasBalances) {
                    this.feeList = [...list];
                    return null;
                }

                const wavesFee = list.find(item => item.asset.id === 'WAVES');
                const filteredList = list.filter((fee) => {
                    const feeBalance = this.balanceHash[fee.asset.id];
                    return !(!hasBalances || !feeBalance || feeBalance.lt(fee));
                });

                if (!filteredList.length) {
                    filteredList.push(wavesFee);
                }

                this.feeList = filteredList;
            }

        }

        return new FeeList();
    };

    controller.$inject = ['Base', 'waves'];

    angular.module('app.ui').component('wFeeList', {
        bindings: {
            type: '<',
            balanceHash: '<',
            fee: '='
        },
        scope: false,
        transclude: false,
        templateUrl: 'modules/ui/directives/feeList/feeList.html',
        controller
    });

})();
