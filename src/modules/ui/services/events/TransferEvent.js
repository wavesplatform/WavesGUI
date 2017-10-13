(function () {
    'use strict';

    /**
     * @param {class ChangeBalanceEvent} ChangeBalanceEvent
     * @param {class AppEvent} AppEvent
     * @param {app.utils.apiWorker} apiWorker
     * @returns {TransferEvent}
     */
    const factory = function (ChangeBalanceEvent, AppEvent, apiWorker) {

        /**
         * @class TransferEvent
         * @extends AppEvent
         */
        class TransferEvent extends ChangeBalanceEvent {

            /**
             * @constructor
             * @param {ITransferEventData} data
             */
            constructor(data) {
                super(data.amount.id, data.amount.balance, data.fee);
                this.id = data.id;
                this.fee = data.fee;
                this.amount = data.amount;
                this.type = data.type;
            }

            getStatus() {
                return apiWorker.process((WavesApi, data) => {
                    return WavesApi.API.Node.v1.transactions.utxGet(data.id)
                        .then(() => data.statuses.PENDING)
                        .catch(() => {
                            return WavesApi.API.Node.v1.transactions.get(data.id)
                                .then(() => data.statuses.SUCCESS)
                                .catch(() => data.statuses.ERROR);
                        });
                }, { id: this.id, statuses: AppEvent.statuses })
                    .then((status) => {
                        return { id: this.id, status };
                    });
            }

            toJSON() {
                return {
                    data: { id: this.id, amount: this.amount, type: this.type, fee: this.fee },
                    type: this.type
                };
            }

        }

        return TransferEvent;
    };

    factory.$inject = ['ChangeBalanceEvent', 'AppEvent', 'apiWorker'];

    angular.module('app.ui')
        .factory('TransferEvent', factory);
})();

/**
 * @typedef {object} ITransferEventData
 * @property {string} id
 * @property {string} type
 * @property {{id: string, balance: number}} amount
 * @property {IFeeData} fee
 */
