(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param $state
     * @param user
     * @param modalManager
     * @return {SaveSeedCtrl}
     */
    const controller = function (Base, $scope, $state, user, modalManager, utils) {

        const ds = require('data-service');
        const PATH = 'modules/saveSeed/templates';

        class SaveSeedCtrl extends Base {

            /**
             * @type {boolean}
             */
            networkError = false;
            /**
             * @type {string}
             */
            password = '';
            /**
             * @type {null}
             */
            loginForm = null;
            /**
             * @type {string}
             */
            activeUserAddress = null;
            /**
             * @type {boolean}
             */
            needPassword = true;
            /**
             * @type {number}
             * @private
             */
            _activeUserIndex = null;
            /**
             * @type {boolean}
             * @public
             */
            isVisibleSeed = false;

            get user() {
                return this.userList[this._activeUserIndex];
            }

            get encryptedSeed() {
                return this.user.encryptedSeed;
            }

            constructor() {
                super($scope);

                this.observe('activeUserAddress', this._calculateActiveIndex);
                this.observe('password', this._updatePassword);

                this._initUserList();
            }


            /**
             * @private
             */
            _updatePassword() {
                if (this.password) {
                    this.showPasswordError = false;
                    this.networkError = false;
                }
            }

            showSeed() {
                try {
                    this.networkError = false;
                    this.showPasswordError = false;
                    const userSettings = user.getSettingsByUser(this.user);
                    const activeUser = { ...this.user, password: this.password, settings: userSettings };
                    const api = ds.signature.getDefaultSignatureApi(activeUser);
                    const adapterAvailablePromise = api.isAvailable(true);

                    let canLoginPromise;

                    if (this._isSeedAdapter(api)) {
                        canLoginPromise = adapterAvailablePromise.then(() => api.getAddress())
                            .then(address => address === activeUser.address ? true : Promise.reject('Wrong address!'));
                    } else {
                        canLoginPromise = modalManager.showLoginByDevice(adapterAvailablePromise, api.type);
                    }

                    return canLoginPromise.then(() => {
                        this.isVisibleSeed = true;
                        ds.app.login(activeUser.address, api);
                        ds.signature.getSignatureApi().getSeed().then(seed => {
                            this.seed = seed;
                        });
                    }, () => {
                        if (!this._isSeedAdapter(api)) {
                            const errorData = {
                                error: 'load-user-error',
                                userType: api.type,
                                address: activeUser.address
                            };
                            return modalManager.showSignDeviceError(errorData)
                                .catch(() => Promise.resolve());
                        } else {
                            this._showPasswordError();
                        }
                    });
                } catch (e) {
                    this._showPasswordError();
                }
            }


            hideSeed() {
                this.password = '';
                this.isVisibleSeed = false;
                ds.app.logOut();
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
            _initUserList() {
                user.getFilteredUserList().then(list => {
                    this.userList = list;
                    this.pendingRestore = false;
                    this._updateActiveUserAddress();
                    utils.postDigest($scope).then(() => {
                        $scope.$apply();
                    });
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
                    this.pageUrl = `${PATH}/saveSeedHasUsers.html`;
                } else {
                    this.pageUrl = `${PATH}/saveSeedNoUsers.html`;
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

        return new SaveSeedCtrl();
    };

    controller.$inject = ['Base', '$scope', '$state', 'user', 'modalManager', 'utils'];

    angular.module('app.saveSeed')
        .controller('SaveSeedCtrl', controller);
})();
