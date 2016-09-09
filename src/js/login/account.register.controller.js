(function () {
    'use strict';

    angular
        .module('app.login')
        .controller('accountRegisterController', ['$scope', 'ui.login.events', 'ui.login.modes',
            function ($scope, events, modes) {
            var vm = this;

            vm.saveAccount = saveAccount;

            function saveAccount() {
                $scope.$emit(events.CHANGE_MODE, modes.LIST);
            }
        }]);
})();
