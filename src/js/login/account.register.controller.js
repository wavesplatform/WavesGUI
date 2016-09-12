(function () {
    'use strict';

    angular
        .module('app.login')
        .controller('accountRegisterController', ['$scope', 'ui.login.events', 'ui.login.modes',
            function ($scope, events, modes) {
            var vm = this;

            vm.saveAccount = saveAccount;
            vm.cancel = cancel;

            function goToListMode() {
                $scope.$emit(events.CHANGE_MODE, modes.LIST);
            }

            function saveAccount() {
                goToListMode();
            }

            function cancel() {
                goToListMode();
            }
        }]);
})();
