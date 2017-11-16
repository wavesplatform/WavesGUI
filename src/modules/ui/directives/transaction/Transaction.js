(function () {
    'use strict';

    const PATH = 'modules/ui/directives/transaction';

    /**
     * @param Base
     * @param $filter
     * @param {AssetsService} assetsService
     * @return {Transaction}
     */
    const controller = function (Base, $filter, assetsService) {

        class Transaction extends Base {

            constructor() {
                super();
            }

            $postLink() {
                const TYPES = this.parent.TYPES;
                const templateType = Transaction._getTemplateType(this.transaction.type, TYPES);
                this.templateUrl = `${PATH}/tx-${templateType}.html`;

                this.type = this.transaction.type;

                // TODO : assign properties depending on the type of transaction
                this.amount = this.transaction.amount;
                this.price = this.transaction.price;
                this.address = Transaction._getTransactionAddress(this.transaction, TYPES);
                this.time = $filter('date')(this.transaction.timestamp, 'HH:mm');

                // TODO : maybe for all transaction types (without `if` statement)
                if (this.type === TYPES.SEND || this.type === TYPES.RECEIVE || this.type === TYPES.CIRCULAR) {
                    // TODO : maybe getRateHistory()
                    assetsService.getRate(this.amount.asset.id, WavesApp.defaultAssets.USD) // TODO!
                        .then((api) => api.exchange(this.amount.getTokens()))
                        .then((balance) => {
                            this.mirrorBalance = balance.toFormat(2); // TODO!
                        });
                }
            }

            /**
             * @param txType
             * @param types
             * @return {*}
             * @private
             */
            static _getTemplateType(txType, types) {
                switch (txType) {
                    case types.SEND:
                    case types.RECEIVE:
                    case types.CIRCULAR:
                        return 'transfer';
                    case types.ISSUE:
                    case types.REISSUE:
                    case types.BURN:
                        return 'tokens';
                    case types.LEASE_IN:
                    case types.LEASE_OUT:
                        return 'lease';
                    case types.EXCHANGE_BUY:
                    case types.EXCHANGE_SELL:
                        return 'exchange';
                    default:
                        return txType;
                }
            }

            /**
             * @param type
             * @param sender
             * @param recipient
             * @param types
             * @return {*}
             * @private
             */
            static _getTransactionAddress({ type, sender, recipient }, types) {
                switch (type) {
                    // TODO : clear this list as there is no need for address in some transactions
                    case types.RECEIVE:
                    case types.ISSUE:
                    case types.REISSUE:
                    case types.LEASE_OUT:
                    case types.CREATE_ALIAS:
                        return sender;
                    default:
                        return recipient;
                }
            }

        }

        return new Transaction();
    };

    controller.$inject = ['Base', '$filter', 'assetsService'];

    angular.module('app.ui').component('wTransaction', {
        bindings: {
            transaction: '<'
        },
        require: {
            parent: '^wTransactionList'
        },
        templateUrl: 'modules/ui/directives/transaction/transaction.html',
        transclude: false,
        controller
    });
})();
