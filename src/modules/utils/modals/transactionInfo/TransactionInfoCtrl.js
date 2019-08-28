(function () {
    'use strict';

    /**
     *
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {ExplorerLinks} explorerLinks
     * @param {Waves} waves
     * @param {IPollCreate} createPoll
     * @return {TransactionInfoCtrl}
     */
    const controller = function (Base, $scope, explorerLinks, waves, createPoll) {

        class TransactionInfoCtrl extends Base {

            constructor({ transactionId }) {
                super($scope);
                this.timer = null;
                this.id = transactionId;
                this._getData();
            }

            $onDestroy() {
                clearTimeout(this.timer);
                super.$onDestroy();
            }

            /**
             * @return Promise<void>
             * @private
             */
            _getData() {
                waves.node.transactions.getAlways(this.id)
                    .then(transaction => this._parseTransaction(transaction))
                    .catch(() => this._onError())
                    .then(tx => this._setData(tx));
            }

            /**
             * @param transaction
             * @return {{confirmations: number, transaction: *}|Promise<{confirmations: number, transaction: *}>}
             * @private
             */
            _parseTransaction(transaction) {
                if (!transaction.isUTX) {
                    return waves.node.height().then((height) => ({
                        confirmations: height - transaction.height,
                        transaction
                    }));
                } else {
                    return {
                        confirmations: -1,
                        transaction
                    };
                }
            }

            /**
             * @private
             */
            _onError() {
                clearTimeout(this.timer);

                if (!this.wasDestroed) {
                    this.timer = setTimeout(() => this._getData(), 2000);
                }
            }

            /**
             * @param tx
             * @private
             */
            _setData(tx) {
                if (!this.wasDestroed && tx) {

                    const { transaction, confirmations } = tx;

                    this.transaction = transaction;
                    this.confirmations = confirmations;
                    this.confirmed = !transaction.isUTX;
                    this.explorerLink = explorerLinks.getTxLink(transaction.id);

                    try {
                        this.signable = ds.signature.getSignatureApi().makeSignable({
                            type: transaction.type,
                            data: transaction
                        });

                        createPoll(this, this._getHeight, this._setHeight, 1000);
                    } catch (e) {
                        this.signable = null;
                    }

                }

                $scope.$apply();
            }

            /**
             * @return {Promise<Array>}
             * @private
             */
            _getHeight() {
                const promiseList = [waves.node.height()];
                if (!this.confirmed) {
                    promiseList.push(waves.node.transactions.getAlways(this.id));
                }
                return Promise.all(promiseList);
            }

            /**
             * @param {number} height
             * @param tx
             * @private
             */
            _setHeight([height, tx]) {
                if (tx) {
                    Object.assign(this.transaction, tx);
                    this.confirmed = !tx.isUTX;
                    if (!this.confirmed) {
                        this.confirmations = 0;
                    } else {
                        this.confirmations = height - tx.height;
                    }
                } else {
                    this.confirmations = height - this.transaction.height;
                }
                $scope.$apply();
            }

        }

        return new TransactionInfoCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope', 'explorerLinks', 'waves', 'createPoll'];

    angular.module('app.utils').controller('TransactionInfoCtrl', controller);
})();
