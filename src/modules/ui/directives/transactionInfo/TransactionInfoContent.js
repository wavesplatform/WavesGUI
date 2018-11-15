(function () {
    'use strict';

    /**
     *
     * @param BaseTxInfo
     * @param {$rootScope.Scope} $scope
     * @param {BalanceWatcher} balanceWatcher
     * @return {TransactionInfoContent}
     */
    const controller = function (BaseTxInfo, $scope, balanceWatcher) {

        class TransactionInfoContent extends BaseTxInfo {

            /**
             * @type {boolean}
             */
            isConfirm = false;

            constructor() {
                super($scope);
                /**
                 * @type {ITransaction}
                 */
                this.transaction = null;
                /**
                 * @type {string}
                 */
                this.txId = null;
                this.toReissue = null;
                this.toRemainOnBalance = null;

            }
            /**
             * @private
             */
            _updateBalance() {
                const tokenID = this.transaction.quantity.asset.id;
                const myBalance = balanceWatcher.getBalance()[tokenID];

                if (!myBalance) {
                    return null;
                }
                this.toReissue = this.transaction.quantity;
                this.toRemainOnBalance = myBalance.add(this.toReissue);
            }

            tokens() {
                super.tokens();
                const all = this.transaction.quantity.asset.quantity;
                const cloned = this.transaction.quantity.cloneWithCoins(all);
                this.totalAfterIssueTokens = this.transaction.quantity.add(cloned);

                if (this.transaction.typeName === 'reissue') {
                    this.isReissueModal = true;
                }
                if (this.isConfirm) {
                    this.receive(balanceWatcher.change, this._updateBalance, this);
                }
            }

        }

        return new TransactionInfoContent();
    };

    controller.$inject = ['BaseTxInfo', '$scope', 'balanceWatcher'];

    angular.module('app.ui').component('wTransactionInfoContent', {
        bindings: {
            signable: '<',
            isConfirm: '<'
        },
        templateUrl: 'modules/ui/directives/transactionInfo/transaction-info-content.html',
        controller
    });
})();
