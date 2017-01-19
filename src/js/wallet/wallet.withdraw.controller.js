(function () {
    'use strict';

    angular
        .module('app.wallet')
        .controller('walletWithdrawController', ['$scope', 'wallet.events', function ($scope, events) {
            var withdraw = this;

            withdraw.submitWithdraw = submitWithdraw;

            $scope.$on(events.WALLET_WITHDRAW, function (event, eventData) {
                $scope.home.featureUnderDevelopment();
            });

            function submitWithdraw () {
            }
        }]);
})();
