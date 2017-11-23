(function () {
    'use strict';

    /**
     * @param EventComponent
     * @param {Waves} waves
     * @param EVENT_STATUSES
     * @return {TransactionComponent}
     */
    const factory = function (EventComponent, waves, EVENT_STATUSES) {

        class TransactionComponent extends EventComponent {

            getStatus() {
                return waves.node.transactions.utxGet(this.id)
                    .then(() => EVENT_STATUSES.PENDING)
                    .catch(() => {
                        return waves.node.transactions.get(this.id)
                            .then(() => EVENT_STATUSES.SUCCESS)
                            .catch(() => EVENT_STATUSES.ERROR);
                    });
            }

        }

        return TransactionComponent;
    };

    factory.$inject = ['EventComponent', 'waves', 'EVENT_STATUSES'];

    angular.module('app').factory('TransactionComponent', factory);
})();
