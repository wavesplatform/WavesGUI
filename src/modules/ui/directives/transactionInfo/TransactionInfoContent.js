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
                this.receive(balanceWatcher.change, this._updateBalance, this);
            }

            tokens() {
                function reformatToTokens(parameter) {
                    return (parameter.slice(0, -2).concat('.')).concat(parameter.slice(-2));
                }

                super.tokens();
                if (this.isConfirm) {
                    const totalInSystemCopecs = parseInt(this.transaction.quantity.asset.quantity.toFixed(), 10);
                    const toBeReissuedCopecs = parseInt(this.transaction.quantity.toCoins(), 10);
                    const totalAfterIssueCopecs = (totalInSystemCopecs + toBeReissuedCopecs).toString();

                    this.totalInSystemTokens = reformatToTokens(totalInSystemCopecs.toString());
                    this.toBeReissuedTokens = reformatToTokens(toBeReissuedCopecs.toString());
                    this.totalAfterIssueTokens = reformatToTokens(totalAfterIssueCopecs);
                }
            }
            /**
             * @private
             */
            _updateBalance() {
                const tokenID = this.transaction.quantity.asset.id;
                this.toRemainOnBalance = balanceWatcher.getBalance()[tokenID]._tokens.toString();

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
