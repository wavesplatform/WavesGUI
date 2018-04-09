(function () {
    'use strict';

    const PATH = 'modules/welcome/templates';

    const controller = function ($state, user, modalManager) {

        class WelcomeCtrl {

            get user() {
                return this.userList[this.activeUserIndex];
            }

            get encryptedSeed() {
                return this.user.encryptedSeed;
            }

            constructor() {
                /**
                 * @type {string}
                 */
                this.password = '';
                /**
                 * @type {null}
                 */
                this.loginForm = null;
                /**
                 * @type {number}
                 */
                this.activeUserIndex = 0;

                user.getUserList()
                    .then((list) => {
                        this.userList = list;
                        this._updatePageUrl();
                    });
            }

            showTutorialModals() {
                return modalManager.showTutorialModals();
            }

            login() {

                try {
                    this.showPasswordError = false;
                    const activeUser = this.user;
                    const encryptionRounds = user.getSettingByUser(activeUser, 'encryptionRounds');
                    const seed = Waves.Seed.decryptSeedPhrase(this.encryptedSeed, this.password, encryptionRounds);

                    Waves.Seed.fromExistingPhrase(seed);

                    user.login({
                        address: activeUser.address,
                        password: this.password
                    });
                } catch (e) {
                    this.password = '';
                    this.showPasswordError = true;
                }

            }

            /**
             * @param {string} address
             */
            removeUser(address) {
                user.removeUserByAddress(address);
                this._updatePageUrl();
                this.userList = this.userList.filter((user) => user.address !== address);
                this.activeUserIndex = 0;
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

    controller.$inject = ['$state', 'user', 'modalManager'];

    angular.module('app.welcome')
        .controller('WelcomeCtrl', controller);
})();
