(function () {
    'use strict';

    function AccountLoginController ($scope, moduleEvents, applicationEvents, modes) {
        var vm = this;

        vm.signIn = signIn;
        vm.cancel = cancel;

        function cleanup() {
            vm.password = '';
        }

        function goToListMode() {
            $scope.$emit(moduleEvents.CHANGE_MODE, modes.LIST);
        }

        function performSignIn() {
            //todo: fill account object
            var account = {};
            $scope.$emit(applicationEvents.LOGIN_SUCCESSFUL, account);
        }

        function signIn() {
            performSignIn();
            cleanup();
        }

        function cancel() {
            goToListMode();
            cleanup();
        }
    }

    AccountLoginController.$inject = ['$scope', 'ui.login.events', 'ui.events', 'ui.login.modes'];

    angular
        .module('app.login')
        .controller('accountLoginController', AccountLoginController);
})();
