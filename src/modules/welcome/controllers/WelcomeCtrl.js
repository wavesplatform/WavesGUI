(function () {
    'use strict';

    class WelcomeCtrl {

        /**
         * @param {WelcomeService} service
         */
        constructor(service) {
            this.service = service;

            this.service.getUserList().then((list) => {
                if (list) {
                    this.userList = list;
                }
            });
        }

    }

    WelcomeCtrl.$inject = ['WelcomeService'];

    angular.module('app.welcome').controller('WelcomeCtrl', WelcomeCtrl);
})();
