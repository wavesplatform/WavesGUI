(function () {
    'use strict';

    angular
        .module('app.shared')
        .factory('transactionBroadcast', ['notificationService', function (notificationService) {
            function Instance(method, successCallback) {
                var self = this;
                var transaction;

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

                    method(transaction).then(function (response) {
                        successCallback(transaction, response);
                    }, function (response) {
                        if (response.data) {
                            notificationService.error('Error:' + response.data.error + ' - ' + response.data.message);
                        } else {
                            notificationService.error('Request failed. Status: ' + response.status + ' - ' +
                                response.statusText);
                        }
                    }).finally(function () {
                        self.pending = false;
                        transaction = undefined;
                    });
                };
            }

            return {
                instance: Instance
            };
        }]);
})();
