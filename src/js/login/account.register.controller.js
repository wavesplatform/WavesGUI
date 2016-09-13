(function () {
    'use strict';

    function AccountRegisterController($scope, events, modes) {
        var vm = this;

        vm.saveAccountAndSignIn = saveAccountAndSignIn;
        vm.cancel = cancel;

        function cleanup() {
            vm.name = '';
            vm.password = '';
            vm.confirmPassword = '';
        }

        function goToListMode() {
            $scope.$emit(events.CHANGE_MODE, modes.LIST);
        }

        function saveAccountAndSignIn() {
            //todo: implement log in procedure
            goToListMode();
            cleanup();
        }

        function cancel() {
            goToListMode();
            cleanup();
        }
    }

    AccountRegisterController.$inject = ['$scope', 'ui.login.events', 'ui.login.modes'];

    angular
        .module('app.login')
        .controller('accountRegisterController', AccountRegisterController);
})();
