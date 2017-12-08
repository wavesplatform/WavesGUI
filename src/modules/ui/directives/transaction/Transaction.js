(function () {
    'use strict';

    const PATH = 'modules/ui/directives/transaction/types';

    /**
     * @param Base
     * @param $filter
     * @param {ModalManager} modalManager
     * @param {NotificationManager} notificationManager
     * @param {Waves} waves
     * @param {CopyService} copyService
     * @param {User} user
     * @param {BaseAssetService} baseAssetService
     * @param {DexService} dexService
     * @param {object} $attrs
     * @return {Transaction}
     */
    const controller = function (Base, $filter, modalManager, notificationManager,
                                 waves, copyService, user, baseAssetService, dexService) {

        class Transaction extends Base {

            $postLink() {
                this.templateUrl = `${PATH}/${this.transaction.templateType}.html`;
                this.time = $filter('date')(this.transaction.timestamp, this.datePattern || 'HH:mm');
                this.shownAddress = this.transaction.shownAddress;
                this.type = this.transaction.type;

                if (this.transaction.amount) {
                    baseAssetService.convertToBaseAsset(this.transaction.amount)
                        .then((baseMoney) => {
                            this.mirrorBalance = baseMoney;
                        });
                }

                const TYPES = waves.node.transactions.TYPES;
                if (this.type === TYPES.EXCHANGE_BUY || this.type === TYPES.EXCHANGE_SELL) {
                    this.totalPrice = dexService.getTotalPrice(this.transaction.amount, this.transaction.price);
                }
            }

            cancelLeasing() {
                return user.getSeed()
                    .then(({ keyPair }) => waves.node.cancelLeasing({
                        transactionId: this.transaction.id,
                        keyPair
                    }))
                    .then((data) => {
                        notificationManager.info({
                            ns: 'app.ui',
                            title: { literal: 'transaction.notifications.closedSuccess' }
                        });
                    }, () => {
                        notificationManager.warn({
                            ns: 'app.ui',
                            title: { literal: 'transaction.notifications.closed' }
                        });
                    });
            }

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

                if (this.type === 'exchange-buy' || this.type === 'exchange-sell') {
                    const asset = tx.price.asset;
                    const price = `Price: ${tx.price.toFormat()} ${asset.name} (${asset.id})`;
                    const totalPrice = `Total price: ${this.totalPrice} ${asset.name}`;
                    message += `\n${price}\n${totalPrice}`;
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

    controller.$inject = [
        'Base',
        '$filter',
        'modalManager',
        'notificationManager',
        'waves',
        'copyService',
        'user',
        'baseAssetService',
        'dexService'
    ];

    angular.module('app.ui')
        .component('wTransaction', {
            bindings: {
                datePattern: '@',
                transaction: '<' // TODO Refactor for listen change transaction. Author Tsigel at 22/11/2017 12:09
            },
            require: {
                parent: '^wTransactionList'
            },
            templateUrl: 'modules/ui/directives/transaction/transaction.html',
            transclude: false,
            controller
        });
})();
