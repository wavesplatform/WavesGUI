(function () {
    'use strict';

    const PATH = 'modules/welcome/templates';

    const controller = function (Base, $scope, $state, user, modalManager) {

        class WelcomeCtrl extends Base {

            get user() {
                return this.userList[this._activeUserIndex];
            }

            get encryptedSeed() {
                return this.user.encryptedSeed;
            }

            constructor() {
                super($scope);
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
                this._activeUserIndex = null;
                this.activeUserAddress = null;

                this.observe('activeUserAddress', this._currentActiveIndex);

                user.getUserList()
                    .then((list) => {
                        this.userList = list;
                        if (list.length) {
                            this.activeUserAddress = list[0].address;
                        }
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
                this.userList = this.userList.filter((user) => user.address !== address);
                if (this.userList.length) {
                    this.activeUserAddress = this.userList[0].address;
                } else {
                    this.activeUserAddress = null;
                }
                this._updatePageUrl();
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

            /**
             * @private
             */
            _currentActiveIndex() {
                const activeAddress = this.activeUserAddress;
                let index = null;

                if (!activeAddress) {
                    return null;
                }

                this.userList.some(({ address }, i) => {
                    if (address === activeAddress) {
                        index = i;
                        return true;
                    }
                    return false;
                });

                this._activeUserIndex = index;
            }

        }

        return new WelcomeCtrl();
    };

    controller.$inject = ['Base', '$scope', '$state', 'user', 'modalManager'];

    angular.module('app.welcome')
        .controller('WelcomeCtrl', controller);
})();
