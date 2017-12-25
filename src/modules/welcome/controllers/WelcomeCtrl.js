(function () {
    'use strict';

    const PATH = 'modules/welcome/templates';

    const controller = function ($state, user) {

        class WelcomeCtrl {

            get address() {
                return this.activeUser;
            }

            get encryptedSeed() {
                return tsUtils.find(this.userList, { address: this.activeUser }).encryptedSeed;
            }

            constructor() {
                this.password = '';
                this.loginForm = null;
                user.getUserList()
                    .then((list) => {
                        this.activeUser = list.length && list[0].address;
                        this.userList = list;
                        this._updatePageUrl();
                    });
            }

            login() {

                try {
                    this.showPasswordError = false;
                    const activeUser = tsUtils.find(this.userList, { address: this.activeUser });
                    const encryptionRounds = user.getSettingByUser(activeUser, 'encryptionRounds');
                    const seed = Waves.Seed.decryptSeedPhrase(this.encryptedSeed, this.password, encryptionRounds);

                    Waves.Seed.fromExistingPhrase(seed);

                    user.login({
                        address: this.address,
                        password: this.password
                    });
                } catch (e) {
                    this.password = '';
                    this.showPasswordError = true;
                }

            }

            removeUser(address) {
                user.removeUserByAddress(address);
                this.userList = this.userList.filter((user) => user.address !== address);
                this._updatePageUrl();
                if (address === this.activeUser) {
                    this.activeUser = this.userList.length && this.userList[0].address;
                }
            }

            /**
             * @private
             */
            _updatePageUrl() {
                if (this.userList.length) {
                    this.pageUrl = `${PATH}/userList.html`;
                } else {
                    this.pageUrl = `${PATH}/welcomeNewUser.html`;
                }
            }

        }

        return new WelcomeCtrl();
    };

    controller.$inject = ['$state', 'user'];

    angular.module('app.welcome')
        .controller('WelcomeCtrl', controller);
})();
