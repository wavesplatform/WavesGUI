(function () {
    'use strict';

    const priorityMap = {
        seed: 0,
        wavesKeeper: 1,
        ledger: 2
    };

    /**
     * @param Base
     * @param $scope
     * @param {User} user
     * @param {app.utils} utils
     * @return {KeeperCtrl}
     */
    const controller = function (Base, $scope, user, utils) {

        const signatureAdapter = require('@waves/signature-adapter');

        class KeeperCtrl extends Base {

            /**
             * @type {boolean}
             */
            isInit = false;
            /**
             * @type {boolean}
             */
            noKeeper = false;
            /**
             * @type {boolean}
             */
            noKeeperPermission = false;
            /**
             * @type {boolean}
             */
            noKeeperAccounts = false;
            /**
             * @type {boolean}
             */
            incorrectKeeperNetwork = false;
            /**
             * @type {boolean}
             */
            lockedKeeper = false;
            /**
             * @type {WavesKeeperAdapter}
             */
            adapter = signatureAdapter.WavesKeeperAdapter;
            /**
             * @type {boolean}
             */
            loading = false;
            /**
             * @type {boolean}
             */
            error = false;
            /**
             * @type {user}
             */
            selectedUser = null;
            /**
             * @type {boolean}
             */
            saveUserData = true;
            /**
             * @type {string}
             */
            name = '';
            /**
             * @type {boolean}
             */
            isPriorityUserTypeExists = false;
            /**
             * @type {object | null}
             */
            userExisted = Object.create(null);
            /**
             * @type {boolean}
             */
            isNameExists = false;
            /**
             * @type {Array}
             * @private
             */
            _usersInStorage = [];
            /**
             * @type {string}
             * @private
             */
            _type = 'wavesKeeper';

            constructor() {
                super($scope);

                user.getFilteredUserList().then(users => {
                    this._usersInStorage = users;
                });

                this.getUsers();
                this.adapter.onUpdate(() => {
                    this.getUsers();
                });
                this.observe('selectedUser', this._onSelectUser);
            }

            /**
             * @return {Promise<boolean>}
             */
            isAvilableAdapter() {
                return this.adapter.isAvailable();
            }

            onError(error) {

                const { code } = error;

                switch (code) {
                    case 0:
                        this.noKeeper = true;
                        break;
                    case 1:
                        this.noKeeperPermission = true;
                        break;
                    case 2:
                        this.noKeeperAccounts = true;
                        break;
                    case 3:
                        this.incorrectKeeperNetwork = true;
                        break;
                    case 'locked':
                        this.lockedKeeper = true;
                        break;
                    default:
                }

                this.error = true;
            }

            /**
             * @return {void}
             */
            getUsers() {
                this.loading = true;
                this.error = false;
                this.noKeeper = false;
                this.noKeeperPermission = false;
                this.noKeeperAccounts = false;
                this.incorrectKeeperNetwork = false;
                this.lockedKeeper = false;

                this.isAvilableAdapter()
                    .then(() => this.adapter.getUserList())
                    .then(([user]) => {
                        if (!user) {
                            return Promise.reject({ code: 'locked' });
                        }
                        this.selectedUser = user;
                        this.receive(utils.observe(this.selectedUser, 'name'), this._onChangeName, this);
                        delete this.selectedUser.type;
                    })
                    .catch((e) => this.onError(e))
                    .finally(() => {
                        this.isInit = true;
                        this.loading = false;
                        $scope.$apply();
                    });
            }

            /**
             * @return {void}
             */
            async login() {
                const userSettings = user.getDefaultUserSettings({ termsAccepted: false });

                if (!this.selectedUser.name) {
                    this.selectedUser.name = await user.getDefaultUserName();
                }

                const newUser = {
                    ...this.selectedUser,
                    userType: this.adapter.type,
                    settings: userSettings,
                    saveToStorage: this.saveUserData
                };

                const api = ds.signature.getDefaultSignatureApi(newUser);

                return user.create({
                    ...newUser,
                    settings: userSettings.getSettings(),
                    api
                }, true, true).catch(() => {
                    this.error = true;
                    $scope.$digest();
                });
            }

            /**
             * @private
             */
            _onSelectUser() {
                this._onChangeAddress();
                this._onChangeName();
            }

            /**
             * @private
             */
            _onChangeAddress() {
                this.userExisted =
                    this._usersInStorage.find(user => user.address === this.selectedUser.address) ||
                    null;
                this.isPriorityUserTypeExists =
                    !!this.userExisted &&
                    priorityMap[this._type] <= priorityMap[this.userExisted.userType];
            }

            /**
             * @private
             */
            _onChangeName() {
                this.isNameExists = this._usersInStorage.some(user => {
                    return user.name === this.selectedUser.name && user.address !== this.selectedUser.address;
                });
            }

        }

        return new KeeperCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', 'utils'];

    angular.module('app.keeper').controller('KeeperCtrl', controller);
})();
