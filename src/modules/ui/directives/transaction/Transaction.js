(function () {
    'use strict';

    const PATH = 'modules/ui/directives/transaction/types';

    /**
     * @param Base
     * @param $filter
     * @param {NotificationManager} notificationManager
     * @param {AssetsService} assetsService
     * @param {CopyService} copyService
     * @param {User} user
     * @return {Transaction}
     */
    const controller = function (Base, $filter, notificationManager, assetsService, copyService, user) {

        class Transaction extends Base {

            constructor() {
                super();
            }

            $postLink() {
                const TYPES = this.parent.TYPES;
                const templateType = Transaction._getTemplateType(this.transaction.type, TYPES);
                this.templateUrl = `${PATH}/${templateType}.html`;

                this.type = this.transaction.type;

                // TODO : assign properties depending on the type of transaction
                this.amount = this.transaction.amount;
                this.price = this.transaction.price;
                this.address = Transaction._getTransactionAddress(this.transaction, TYPES);
                this.time = $filter('date')(this.transaction.timestamp, 'HH:mm');

                // TODO : maybe for all transaction types (without `if` statement)
                if (this.type === TYPES.SEND || this.type === TYPES.RECEIVE || this.type === TYPES.CIRCULAR) {
                    user.getSetting('baseAssetId')
                        .then(assetsService.getAssetInfo)
                        .then((baseAsset) => {
                        // TODO : change to getRateByDate()
                        assetsService.getRate(this.amount.asset.id, baseAsset.id)
                            .then((api) => api.exchange(this.amount.getTokens()))
                            .then((balance) => {
                                this.mirrorBalance = balance.toFormat(baseAsset.precision);
                            });
                    });
                }
            }

            cancelLeasing() {} // TODO

            showTransaction() {} // TODO

            /**
             * return {string}
             */
            copyId() {
                copyService.copy(this.transaction.id);
                notificationManager.info({
                    ns: 'app.ui',
                    title: { literal: 'transaction.notifications.txIdCopied' }
                });
            }

            /**
             * return {string}
             */
            copyAllData() {
                const tx = this.transaction;

                const id = `Transaction ID: ${tx.id}`;
                const type = `Type: ${tx.transactionType} (${this.type})`;

                const timestamp = $filter('date')(tx.timestamp, 'MM/dd/yyyy HH:mm');
                const datetime = `Date: ${timestamp}`;

                let sender = `Sender: ${tx.sender}`;
                if (tx.transactionType === 'exchange') {
                    sender += ' (matcher address)';
                }

                let message = `${id}\n${type}\n${datetime}\n${sender}`;

                if (tx.recipient) {
                    const recipient = `Recipient: ${tx.recipient}`;
                    message += `\n${recipient}`;
                }

                if (tx.amount) {
                    const asset = tx.amount.asset;
                    const amount = `Amount: ${tx.amount.toFormat()} ${asset.name} (${asset.id})`;
                    message += `\n${amount}`;
                }

                if (this.price) {
                    const asset = tx.price.asset;
                    const price = `Price: ${tx.price.toFormat()} ${asset.name} (${asset.id})`;
                    message += `\n${price}`;
                }

                const fee = `Fee: ${tx.fee.toFormat()} ${tx.fee.asset.name} (${tx.fee.asset.id})`;
                message += `\n${fee}`;

                copyService.copy(message);
                notificationManager.info({
                    ns: 'app.ui',
                    title: { literal: 'transaction.notifications.txDataCopied' }
                });
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

    controller.$inject = ['Base', '$filter', 'notificationManager', 'assetsService', 'copyService', 'user'];

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
