(function () {
    'use strict';

    const PATH = 'modules/welcome/templates/';

    /**
     * @param {WelcomeService} service
     */
    const controller = function ($state, apiWorker, user) {

        class WelcomeCtrl {

            get address() {
                return this.userList[this.activeUser].address;
            }

            get encryptSeed() {
                return this.userList[this.activeUser].encryptSeed;
            }

            constructor() {
                this.activeUser = 0;
                this.password = '';

                user.getUserList().then((list) => {
                    if (list.length) {
                        this.userList = list;
                        this.pageUrl = `${PATH}/userList.html`;
                    } else {
                        this.pageUrl = `${PATH}/welcomeNewUser.html`;
                    }
                });
            }

            getStarted() {
                $state.go('get_started');
            }

            login() {
                apiWorker.process((api, data) => {
                    return api.decryptSeed(data.encryptSeed, data.password);
                }, { password: this.password, encryptSeed: this.encryptSeed })
                    .then((seed) => {
                        if (seed) { // TODO remove if
                            user.login({
                                address: this.address,
                                encryptSeed: this.encryptSeed
                            });
                            console.log('success');
                        }
                    }, () => {
                        console.error('Wrong password');
                    });
            }

        }

        return new WelcomeCtrl();
    };

    controller.$inject = ['$state', 'apiWorker', 'user'];

    angular.module('app.welcome').controller('WelcomeCtrl', controller);
})();
