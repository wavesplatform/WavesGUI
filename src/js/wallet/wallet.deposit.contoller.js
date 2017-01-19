(function () {
    'use strict';

    angular
        .module('app.wallet')
        .controller('walletDepositController', ['$scope', 'wallet.events', function ($scope, events) {
            $scope.$on(events.WALLET_DEPOSIT, function (event, eventData) {
                $scope.home.featureUnderDevelopment();
            });
        }]);
})();
