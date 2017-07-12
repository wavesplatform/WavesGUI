(function () {
    'use strict';

    function TransactionBroadcast(notificationService) {

        function Instance(method, successCallback) {

            const self = this;
            let transaction;

            this.pending = false;
            this.setTransaction = function (value) {
                transaction = value;
            };

            this.broadcast = function () {
                // checking if transaction was saved
                if (angular.isUndefined(transaction)) {
                    return;
                }

                // prevent method execution when there is a pending request
                if (self.pending) {
                    return;
                }

                // start pending request
                self.pending = true;

                method(transaction)
                    .then((response) => {
                        successCallback(transaction, response);
                    }, (res) => {
                        if (res.data) {
                            notificationService.error(`Error: ${res.data.error} - ${res.data.message}`);
                        } else {
                            notificationService.error(`Request failed. Status: ${res.status} - ${res.statusText}`);
                        }
                    })
                    .finally(() => {
                        self.pending = false;
                        transaction = undefined;
                    });
            };
        }

        return {
            instance: Instance
        };
    }

    TransactionBroadcast.$inject = [`notificationService`];

    angular
        .module(`app.shared`)
        .factory(`transactionBroadcast`, TransactionBroadcast);
})();
