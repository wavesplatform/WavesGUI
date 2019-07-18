(function () {
    'use strict';

    const { Money } = require('@waves/data-entities');
    const ds = require('data-service');

    /**
     * @param {typeof Base} Base
     * @param {$rootScope.Scope} $scope
     * @param {Waves} waves
     * @param {BalanceWatcher} balanceWatcher
     * @return {BurnInfo}
     */
    const controller = function (Base, $scope, waves, balanceWatcher) {

        class BurnInfo extends Base {

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
                ds.api.assets.get(assetId).then(asset => {
                    const quantity = new Money(asset.quantity, asset);
                    const toReissue = this.transaction.amount;

                    this.toRemainOnBalance = (hash[assetId] || new Money(0, asset)).sub(toReissue);
                    this.totalAfterIssueTokens = quantity.sub(toReissue);

                    $scope.$apply();
                });
            }

        }

        return new BurnInfo();
    };

    controller.$inject = ['Base', '$scope', 'waves', 'balanceWatcher'];

    angular.module('app.ui').component('wBurnInfo', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/burn/burn-info.html'
    });
})();
