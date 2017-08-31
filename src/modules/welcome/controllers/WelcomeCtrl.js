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

            get encryptedSeed() {
                return this.userList[this.activeUser].encryptedSeed;
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
                apiWorker.process((waves, data) => {
                    return waves.Seed.decryptSeedPhrase(data.encryptedSeed, data.password);
                }, { password: this.password, encryptedSeed: this.encryptedSeed })
                    .then(() => {
                        user.login({
                            address: this.address,
                            encryptedSeed: this.encryptedSeed
                        });
                        console.log('success');
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
