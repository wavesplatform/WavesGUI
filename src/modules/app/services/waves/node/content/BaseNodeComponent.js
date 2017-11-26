(function () {
    'use strict';

    /**
     * @param {app.utils} utils
     * @param {EventManager} eventManager
     * @param {app.utils.decorators} decorators
     * @return {BaseNodeComponent}
     */
    const factory = function (utils, eventManager, decorators) {

        class BaseNodeComponent {

            /**
             * Get list of available fee for transaction
             * @param {string} transactionType
             * @return {Promise<Money[]>}
             * @protected
             */
            @decorators.cachable()
            _feeList(transactionType) {
                switch (transactionType) {
                    case 'transfer':
                    case 'exchange':
                    case 'lease':
                    case 'cancelLeasing':
                    case 'createAlias':
                    case 'burn':
                        return utils.whenAll([
                            Waves.Money.fromTokens('0.001', WavesApp.defaultAssets.WAVES)
                        ]);
                    case 'reissue':
                    case 'issue':
                        return utils.whenAll([
                            Waves.Money.fromTokens('1', WavesApp.defaultAssets.WAVES)
                        ]);
                    default:
                        throw new Error(`Wrong transaction type! ${transactionType}`);
                }
            }

            /**
             * @param {string} transactionType
             * @param {Money} [fee]
             * @return {Promise<Money>}
             */
            getFee(transactionType, fee) {
                return this._feeList(transactionType)
                    .then((list) => {
                        if (fee) {
                            const hash = utils.toHash(list, 'asset.id');
                            if (hash[fee.asset.id] && hash[fee.asset.id].getTokens()
                                    .lte(fee.getTokens())) {
                                return fee;
                            } else {
                                throw new Error('Wrong fee!');
                            }
                        } else {
                            return list[0];
                        }
                    });
            }

            /**
             * Method for create transaction event for event manager
             * @param {Money[]} moneyList
             * @protected
             */
            _pipeTransaction(moneyList) {
                return (transaction) => {
                    eventManager.addTx(transaction, moneyList);
                    return transaction;
                };
            }

        }

        return BaseNodeComponent;
    };

    factory.$inject = ['utils', 'eventManager', 'decorators'];

    angular.module('app')
        .factory('BaseNodeComponent', factory);
})();
