(function () {
    'use strict';

    class CreateIdCtrl {

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

    CreateIdCtrl.$inject = ['WelcomeService'];

    angular.module('app.welcome').controller('CreateIdCtrl', CreateIdCtrl);
})();
