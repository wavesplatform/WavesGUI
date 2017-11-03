(function () {
    'use strict';

    const factory = function (EventComponent, apiWorker, EVENT_STATUSES) {

        class TransferComponent extends EventComponent {

            getStatus() {
                return apiWorker.process((WavesApi, data) => {
                    return WavesApi.API.Node.v1.transactions.utxGet(data.id)
                        .then(() => data.statuses.PENDING)
                        .catch(() => {
                            return WavesApi.API.Node.v1.transactions.get(data.id)
                                .then(() => data.statuses.SUCCESS)
                                .catch(() => data.statuses.ERROR);
                        });
                }, { id: this.id, statuses: EVENT_STATUSES });
            }

        }

        return TransferComponent;
    };

    factory.$inject = ['EventComponent', 'apiWorker', 'EVENT_STATUSES'];

    angular.module('app').factory('TransferComponent', factory);
})();
