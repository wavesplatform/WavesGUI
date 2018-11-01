(function () {
    'use strict';

    const PATH = 'modules/welcome/templates';

    /**
     * @param Base
     * @param $scope
     * @param $state
     * @param user
     * @param modalManager
     * @param $element
     * @param storage
     * @param {app.utils} utils
     * @return {WelcomeCtrl}
     */
    const controller = function (Base, $scope, $state, user, modalManager, $element, storage, utils) {

        const ds = require('data-service');

        class WelcomeCtrl extends Base {

            get user() {
                return this.userList[this._activeUserIndex];
            }

            get encryptedSeed() {
                return this.user.encryptedSeed;
            }

            /**
             * @type {boolean}
             */
            networkError = false;

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
                 * @type {boolean}
                 */
                this.needPassword = true;
                /**
                 * @type {number}
                 * @private
                 */
                this._activeUserIndex = null;

                this.observe('activeUserAddress', this._calculateActiveIndex);
                this.observe('password', this._updatePassword);

                if (WavesApp.isWeb()) {
                    storage.load('accountImportComplete')
                        .then((complete) => {
                            if (complete) {
                                this._initUserList();
                            } else {
                                this._loadUserListFromBeta();
                            }
                        });
                } else {
                    this._initUserList();
                }
            }

            showTutorialModals() {
                return modalManager.showTutorialModals();
            }

            _updatePassword() {
                if (this.password) {
                    this.showPasswordError = false;
                    this.networkError = false;
                }
            }

            login() {
                try {
                    this.networkError = false;
                    this.showPasswordError = false;
                    const userSettings = user.getSettingsByUser(this.user);
                    const activeUser = { ...this.user, password: this.password, settings: userSettings };
                    const api = ds.signature.getDefaultSignatureApi(activeUser);
                    const adapterAvailablePromise = api.isAvailable();

                    let canLoginPromise;

                    if (this._isSeedAdapter(api)) {
                        canLoginPromise = adapterAvailablePromise.then(() => api.getAddress())
                            .then(address => address === activeUser.address ? true : Promise.resolve('Wrong address!'));
                    } else {
                        canLoginPromise = modalManager.showSignLedger({
                            promise: adapterAvailablePromise,
                            mode: `connect-${api.type}`
                        }).then(() => adapterAvailablePromise);
                    }

                    return canLoginPromise.then(() => {
                        return user.login({
                            api,
                            userType: api.type,
                            password: this.password,
                            address: activeUser.address
                        });
                    }, () => {
                        if (!this._isSeedAdapter(api)) {
                            return modalManager.showLedgerError({ error: 'load-user-error' })
                                .catch(() => Promise.resolve());
                        } else {
                            this._showPasswordError();
                        }
                    });
                } catch (e) {
                    this._showPasswordError();
                }
            }

            /**
             * @param {string} address
             */
            removeUser(address) {
                const user = this.userList.find((user) => user.address === address);
                modalManager.showConfirmDeleteUser(user).then(() => {
                    this._deleteUser(address);
                });
            }

            /**
             * @param {Adapter} api
             * @return boolean
             * @private
             */
            _isSeedAdapter(api) {
                return api.type && api.type === 'seed';
            }

            /**
             * @private
             */
            _showPasswordError() {
                this.password = '';
                this.showPasswordError = true;
                this.networkError = this.user.networkError;
            }

            /**
             * @private
             */
            _deleteUser(address) {
                user.removeUserByAddress(address);
                this.userList = this.userList.filter((user) => user.address !== address);
                this._updateActiveUserAddress();
            }

            _initUserList() {
                user.getUserList()
                    .then((list) => {
                        this.userList = list;
                        this.pendingRestore = false;
                        this._updateActiveUserAddress();
                        setTimeout(() => {
                            $scope.$apply(); // TODO FIX!
                        }, 100);
                    });
            }

            _loadUserListFromBeta() {
                this.pendingRestore = true;
                utils.importAccountByIframe(WavesApp.betaOrigin, 5000)
                    .then((userList) => {
                        this.userList = userList || [];
                        this.pendingRestore = false;
                        this._updateActiveUserAddress();

                        $scope.$apply();

                        storage.save('accountImportComplete', true);
                        storage.save('userList', userList);
                    })
                    .catch(() => {
                        storage.save('accountImportComplete', true);
                        this._initUserList();
                    });
            }

            /**
             * @private
             */
            _updateActiveUserAddress() {
                if (this.userList.length) {
                    this.activeUserAddress = this.userList[0].address;
                    this.needPassword = !this.userList[0].userType || this.userList[0].userType === 'seed';
                } else {
                    this.activeUserAddress = null;
                    this.needPassword = true;
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
                this.needPassword = !this.userList[index].userType || this.userList[index].userType === 'seed';
            }

        }

        return new WelcomeCtrl();
    };

    controller.$inject = ['Base', '$scope', '$state', 'user', 'modalManager', '$element', 'storage', 'utils'];

    angular.module('app.welcome')
        .controller('WelcomeCtrl', controller);
})();
