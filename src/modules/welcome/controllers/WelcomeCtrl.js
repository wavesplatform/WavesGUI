(function () {
    'use strict';

    const PATH = 'modules/welcome/templates';

    const controller = function (Base, $scope, $state, user, modalManager, $element, storage) {

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
                 * @type {string}
                 */
                this.activeUserAddress = null;
                /**
                 * @type {number}
                 * @private
                 */
                this._activeUserIndex = null;

                this.observe('activeUserAddress', this._calculateActiveIndex);

                storage.load('accountImportComplete')
                    .then((complete) => {
                        if (complete) {
                            this._initUserList();
                        } else {
                            this._loadUserListFromBeta();
                        }
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
                    const seed = ds.Seed.decryptSeedPhrase(this.encryptedSeed, this.password, encryptionRounds);
                    const keyPair = (new ds.Seed(seed)).keyPair;

                    user.login({
                        address: activeUser.address,
                        api: ds.signature.getDefaultSignatureApi(keyPair, activeUser.address, seed),
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
                this._updateActiveUserAddress();
            }

            _initUserList() {
                user.getUserList()
                    .then((list) => {
                        this.userList = list;
                        this._updateActiveUserAddress();
                        setTimeout(() => {
                            $scope.$apply(); // TODO FIX!
                        }, 100);
                    });
            }

            _loadUserListFromBeta() {
                /**
                 * @type {HTMLIFrameElement}
                 */
                const iframe = document.createElement('iframe');

                const onMessage = (data) => {
                    if (data.type === 'event' && data.name === 'loadEnd') {
                        const message = {
                            type: 'action',
                            name: 'getStorageData'
                        };
                        iframe.contentWindow.postMessage(message, WavesApp.betaOrigin);
                    } else if (data.type === 'response') {
                        this.userList = data.content;
                        this._updateActiveUserAddress();
                        $scope.$apply();
                        document.body.removeChild(iframe);
                        storage.save('accountImportComplete', true);
                        storage.save('userList', data.content);
                    }
                };

                const onError = () => {
                    this._initUserList();
                };

                iframe.addEventListener('load', () => {
                    window.addEventListener('message', (event) => {
                        if (event.origin === location.origin || event.origin === WavesApp.betaOrigin) {
                            onMessage(event.data);
                        }
                    }, false);
                }, false);

                iframe.addEventListener('error', () => {
                    document.body.removeChild(iframe);
                    onError();
                }, false);

                iframe.src = `${WavesApp.betaOrigin}/export`;
                iframe.style.opacity = '0';
                iframe.style.position = 'absolute';

                document.body.appendChild(iframe);
            }

            /**
             * @private
             */
            _updateActiveUserAddress() {
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
            _calculateActiveIndex() {
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

    controller.$inject = ['Base', '$scope', '$state', 'user', 'modalManager', '$element', 'storage'];

    angular.module('app.welcome')
        .controller('WelcomeCtrl', controller);
})();
