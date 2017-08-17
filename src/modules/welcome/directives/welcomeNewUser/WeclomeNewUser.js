(function () {
    'use strict';

    class WelcomeNewUserCtrl {

        /**
         * @param {WelcomeService} service
         */
        constructor(service, $state) {
            this.service = service;
            this.$state = $state;
        }

        getStarted() {
            this.$state.go('create_id');
        }

        restoreBackup() {
            console.log('go to restore backup');
        }

    }

    WelcomeNewUserCtrl.$inject = ['WelcomeService', '$state'];

    angular.module('app.welcome').component('wWelcomeNewUser', {
        templateUrl: 'modules/welcome/directives/welcomeNewUser/welcomeNewUser.html',
        scope: false,
        controller: WelcomeNewUserCtrl
    });
})();
