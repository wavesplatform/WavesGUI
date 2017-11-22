(function () {
    'use strict';

    const PATH = 'modules/welcome/templates';

    const controller = function ($state, user) {

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

                try {
                    this.showPasswordError = false;
                    const encryptionRounds = user.getSettingByUser(this.userList[this.activeUser], 'encryptionRounds');
                    const seed = Waves.Seed.decryptSeedPhrase(this.encryptedSeed, this.password, encryptionRounds);

                    const seedData = Waves.Seed.fromExistingPhrase(seed);
                    const encryptedSeed = seedData.encryptedSeed;
                    const publicKey = seedData.keyPair.publicKey;

                    user.login({
                        address: this.address,
                        password: this.password,
                        encryptedSeed,
                        publicKey
                    });
                } catch (e) {
                    this.password = '';
                    this.showPasswordError = true;
                }

            }

        }

        return new WelcomeCtrl();
    };

    controller.$inject = ['$state', 'user'];

    angular.module('app.welcome')
        .controller('WelcomeCtrl', controller);
})();
