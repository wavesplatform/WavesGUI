(function () {
    'use strict';

    const PATH = 'modules/welcome/templates';

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
                this.loginForm = null;
                user.getUserList()
                    .then((list) => {
                        if (list.length) {
                            this.userList = list;
                            this.pageUrl = `${PATH}/userList.html`;
                        } else {
                            this.pageUrl = `${PATH}/welcomeNewUser.html`;
                        }
                    });
            }

            login() {
                this.showPasswordError = false;
                const encryptionRounds = user.getSettingByUser(this.userList[this.activeUser], 'encryptionRounds');
                apiWorker.process((Waves, data) => {
                    return Waves.Seed.decryptSeedPhrase(data.encryptedSeed, data.password, data.encryptionRounds);
                }, { password: this.password, encryptedSeed: this.encryptedSeed, encryptionRounds })
                    .then(() => {
                        user.addUserData({
                            address: this.address,
                            encryptedSeed: this.encryptedSeed,
                            password: this.password
                        });
                    }, () => {
                        this.password = '';
                        this.showPasswordError = true;
                    });
            }

        }

        return new WelcomeCtrl();
    };

    controller.$inject = ['$state', 'apiWorker', 'user'];

    angular.module('app.welcome')
        .controller('WelcomeCtrl', controller);
})();
