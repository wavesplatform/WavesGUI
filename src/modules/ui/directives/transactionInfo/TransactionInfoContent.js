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
            _updateBalance(options) {
                const noApply = options && options.noApply || false;
                const tokenID = this.transaction.quantity.asset.id;
                const myBalance = balanceWatcher.getBalance()[tokenID];

                if (!myBalance) {
                    return null;
                }
                this.toReissue = this.transaction.quantity;
                this.toRemainOnBalance = myBalance.add(this.toReissue);

                if (!noApply) {
                    $scope.$apply();
                }
            }

            tokens() {
                super.tokens();

                if (this.transaction.typeName !== 'reissue') {
                    return null;
                }

                const all = this.transaction.quantity.asset.quantity;
                const cloned = this.transaction.quantity.cloneWithCoins(all);
                this.totalAfterIssueTokens = this.transaction.quantity.add(cloned);

                if (this.isConfirm) {
                    this.receive(balanceWatcher.change, this._updateBalance, this);
                    this._updateBalance({ noApply: true });
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
