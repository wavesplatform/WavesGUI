(function () {
    'use strict';

    const { Money } = require('@waves/data-entities');

    /**
     * @param {typeof Base} Base
     * @param {$rootScope.Scope} $scope
     * @param {Waves} waves
     * @param {BalanceWatcher} balanceWatcher
     * @return {ReissueInfo}
     */
    const controller = function (Base, $scope, waves, balanceWatcher) {

        class ReissueInfo extends Base {

            /**
             * @type {Signable}
             */
            signable;
            /**
             * @type {boolean}
             */
            isConfirm = false;
            /**
             * @type {string}
             */
            id = '';
            /**
             * @type {Money}
             */
            toRemainOnBalance;
            /**
             * @type {Money}
             */
            totalAfterIssueTokens;


            $postLink() {
                this.transaction = this.signable.getTxData();

                const addId = id => (this.id = id);
                const getTx = id => waves.node.transactions.get(id);
                const $apply = () => $scope.$apply();
                const addConfirm = isConfirm => (this.isConfirm = isConfirm);

                (this.transaction.id ? Promise.resolve(this.transaction.id) : this.signable.getId())
                    .then(addId)
                    .then(getTx)
                    .then(() => false, () => true)
                    .then(addConfirm)
                    .then($apply);

                this.receive(balanceWatcher.change, this._onChangeBalances, this);

                this._onChangeBalances();
            }

            /**
             * @private
             */
            _onChangeBalances() {
                const hash = balanceWatcher.getBalance();

                if (!Object.keys(hash).length) {
                    return null;
                }

                const assetId = this.transaction.assetId;
                const quantity = new Money(hash[assetId].asset.quantity, hash[assetId].asset);
                const toReissue = this.transaction.quantity;

                this.toRemainOnBalance = hash[assetId].add(toReissue);
                this.totalAfterIssueTokens = quantity.add(toReissue);
            }

        }

        return new ReissueInfo();
    };

    controller.$inject = ['Base', '$scope', 'waves', 'balanceWatcher'];

    angular.module('app.ui').component('wReissueInfo', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/reissue/reissue-info.html'
    });
})();
