(function () {
    'use strict';

    const PATH = 'modules/ui/directives/transaction/types';

    /**
     * @param Base
     * @param $filter
     * @param {TransactionsService} transactionsService
     * @param {ModalManager} modalManager
     * @param {NotificationManager} notificationManager
     * @param {AssetsService} assetsService
     * @param {CopyService} copyService
     * @param {User} user
     * @return {Transaction}
     */
    const controller = function (Base, $filter, transactionsService, modalManager, notificationManager, assetsService, copyService, user) {

        class Transaction extends Base {

            constructor() {
                super();
            }

            $postLink() {
                this.templateUrl = `${PATH}/${this.transaction.templateType}.html`;
                this.time = $filter('date')(this.transaction.timestamp, 'HH:mm');
                this.shownAddress = this.transaction.shownAddress;
                this.type = this.transaction.type;

                // TODO : maybe for all transaction types (without `if` statement)
                const TYPES = transactionsService.TYPES;
                if (this.type === TYPES.SEND || this.type === TYPES.RECEIVE || this.type === TYPES.CIRCULAR) {
                    user.getSetting('baseAssetId')
                        .then(assetsService.getAssetInfo)
                        .then((baseAsset) => {
                        // TODO : change to getRateByDate()
                        assetsService.getRate(this.transaction.amount.asset.id, baseAsset.id)
                            .then((api) => api.exchange(this.transaction.amount.getTokens()))
                            .then((balance) => {
                                this.mirrorBalance = balance.toFormat(baseAsset.precision);
                            });
                    });
                }
            }

            cancelLeasing() {} // TODO

            showTransaction() {
                modalManager.showTransactionInfo(this.transaction.id);
            }

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

                if (tx.price) {
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

        }

        return new Transaction();
    };

    controller.$inject = ['Base', '$filter', 'transactionsService', 'modalManager', 'notificationManager', 'assetsService', 'copyService', 'user'];

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
