(function () {
    'use strict';

    const PATH = 'modules/welcome/templates/';

    /**
     * @param {WelcomeService} service
     */
    const controller = function (service, $state) {

        class WelcomeCtrl {

            constructor() {

                service.getUserList().then((list) => {
                    if (list && list.length) {
                        this.userList = list;
                        // TODO add template ...
                    } else {
                        this.pageUrl = `${PATH}/welcomeNewUser.html`;
                    }
                });
            }

            getStarted() {
                $state.go('get_started');
            }

        }

        return new WelcomeCtrl();
    };

    controller.$inject = ['WelcomeService', '$state'];

    angular.module('app.welcome').controller('WelcomeCtrl', controller);
})();
