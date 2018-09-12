(function () {
    'use strict';

    const PATH = 'modules/ui/directives/transaction/types';
    const tsUtils = require('ts-utils');

    /**
     * @param Base
     * @param $filter
     * @param {ModalManager} modalManager
     * @param {INotification} notification
     * @param {Waves} waves
     * @param {User} user
     * @param {BaseAssetService} baseAssetService
     * @param {DexService} dexService
     * @param {$rootScope.Scope} $scope
     * @return {Transaction}
     */
    const controller = function (Base, $filter, modalManager, notification,
                                 waves, user, baseAssetService, dexService, $scope) {

        class Transaction extends Base {

            $postLink() {

                this.templateUrl = `${PATH}/${this.transaction.templateType}.html`;
                this.time = $filter('date')(this.transaction.timestamp, this.datePattern || 'HH:mm');
                this.shownAddress = this.transaction.shownAddress;
                this.typeName = this.transaction.typeName;
                this.isScam = !!WavesApp.scam[this.transaction.assetId];

                const TYPES = waves.node.transactions.TYPES;
                if (this.typeName === TYPES.BURN || this.typeName === TYPES.ISSUE || this.typeName === TYPES.REISSUE) {
                    this.titleAssetName = this.getAssetName(tsUtils.get(this.transaction, 'amount.asset') ||
                        tsUtils.get(this.transaction, 'quantity.asset'));
                    this.name = tsUtils.get(this.transaction, 'amount.asset.name') ||
                        tsUtils.get(this.transaction, 'quantity.asset.name');
                    this.amount = (tsUtils.get(this.transaction, 'amount') ||
                        tsUtils.get(this.transaction, 'quantity')).toFormat();
                }

                if (this.transaction.amount && this.transaction.amount instanceof ds.wavesDataEntities.Money) {
                    baseAssetService.convertToBaseAsset(this.transaction.amount)
                        .then((baseMoney) => {
                            this.mirrorBalance = baseMoney;
                            $scope.$digest();
                        });
                }

                if (this.typeName === TYPES.EXCHANGE_BUY || this.typeName === TYPES.EXCHANGE_SELL) {
                    this.totalPrice = dexService.getTotalPrice(this.transaction.amount, this.transaction.price);
                }

                if ([TYPES.SPONSORSHIP_START, TYPES.SPONSORSHIP_STOP].includes(this.typeName)) {
                    this.sponsorshipFee = this.transaction.minSponsoredAssetFee;
                    this.titleAssetName = this.getAssetName(
                        tsUtils.get(this.transaction, 'minSponsoredAssetFee.asset')
                    );
                }
            }

            getAssetName(asset) {
                try {
                    return !WavesApp.scam[asset.id] ? asset.name : '';
                } catch (e) {
                    return '';
                }
            }

            cancelLeasing() {
                const leaseTransactionAmount = this.transaction.amount;
                const leaseId = this.transaction.id;
                return waves.node.getFee({ type: WavesApp.TRANSACTION_TYPES.NODE.CANCEL_LEASING })
                    .then((fee) => modalManager.showConfirmTx(WavesApp.TRANSACTION_TYPES.NODE.CANCEL_LEASING, {
                        fee,
                        leaseTransactionAmount,
                        leaseId
                    }));
            }

            showTransaction() {
                modalManager.showTransactionInfo(this.transaction.id);
            }

            /**
             * return {string}
             */
            getCopyAllData() {
                const tx = this.transaction;

                const id = `Transaction ID: ${tx.id}`;
                const type = `Type: ${tx.type} (${this.typeName})`;

                const timestamp = $filter('date')(tx.timestamp, 'MM/dd/yyyy HH:mm');
                const datetime = `Date: ${timestamp}`;

                let sender = `Sender: ${tx.sender}`;
                if (tx.typeName === WavesApp.TRANSACTION_TYPES.NODE.EXCHANGE) {
                    sender += ' (matcher address)';
                }

                let message = `${id}\n${type}\n${datetime}\n${sender}`;

                if (tx.typeName === WavesApp.TRANSACTION_TYPES.EXTENDED.UNKNOWN) {
                    message += '\n\nRAW TX DATA BELOW\n\n';
                    message += JSON.stringify(tx, null, 2);
                    return message;
                }

                if (tx.recipient) {
                    const recipient = `Recipient: ${tx.recipient}`;
                    message += `\n${recipient}`;
                }

                if (tx.amount && tx.amount instanceof ds.wavesDataEntities.Money) {
                    const asset = tx.amount.asset;
                    const amount = `Amount: ${tx.amount.toFormat()} ${asset.name} (${asset.id})`;
                    message += `\n${amount}`;
                }

                if (this.typeName === WavesApp.TRANSACTION_TYPES.EXTENDED.EXCHANGE_BUY ||
                    this.typeName === WavesApp.TRANSACTION_TYPES.EXTENDED.EXCHANGE_SELL) {
                    const asset = tx.price.asset;
                    const price = `Price: ${tx.price.toFormat()} ${asset.name} (${asset.id})`;
                    const totalPrice = `Total price: ${this.totalPrice} ${asset.name}`;
                    message += `\n${price}\n${totalPrice}`;
                }

                if (this.typeName === WavesApp.TRANSACTION_TYPES.EXTENDED.DATA) {
                    message += '\n\n\nDATA START';
                    message += `\n\n${tx.stringifiedData}`;
                    message += '\n\nDATA END\n\n';
                }

                const fee = `Fee: ${tx.fee.toFormat()} ${tx.fee.asset.name} (${tx.fee.asset.id})`;
                message += `\n${fee}`;

                return message;
            }

        }

        return new Transaction();
    };

    controller.$inject = [
        'Base',
        '$filter',
        'modalManager',
        'notification',
        'waves',
        'user',
        'baseAssetService',
        'dexService',
        '$scope'
    ];

    angular.module('app.ui')
        .component('wTransaction', {
            bindings: {
                datePattern: '@',
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
