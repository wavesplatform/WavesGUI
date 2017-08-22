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
                    if (list.length) {
                        this.userList = list;
                        if (this.userList.length === 1) {
                            this.pageUrl = `${PATH}/oneUser.html`;
                        } else {
                            this.pageUrl = `${PATH}/userList.html`;
                        }
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
