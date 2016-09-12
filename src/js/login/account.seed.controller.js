(function () {
    'use strict';

    angular
        .module('app.login')
        .controller('accountSeedController', ['$scope', 'ui.login.events', 'ui.login.modes',
            function ($scope, events, modes) {
            var vm = this;

            vm.registerAccount = registerAccount;
            vm.back = goBack;

            function registerAccount() {
                $scope.$emit(events.CHANGE_MODE, modes.REGISTER);
            }

            function goBack() {
                $scope.$emit(events.CHANGE_MODE, modes.LIST);
            }
        }]);
})();
