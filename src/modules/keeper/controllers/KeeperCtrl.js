(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {ng.IScope} $scope
     * @param {*} $state
     * @param {User} user
     * @param {app.utils} utils
     * @return {KeeperCtrl}
     */
    const controller = function (Base, $scope, $state, user, utils) {

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
            selectedUser = Object.create(null);
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
             * @type {Array}
             * @private
             */
            _usersInStorage = [];
            /**
             * @type {string}
             * @private
             */
            _type = 'wavesKeeper';
            /**
             * @type {object}
             * @private
             */
            _priorityMap = utils.getImportPriorityMap();

            constructor() {
                super($scope);

                this.observe('selectedUser', this._onSelectUser);
                this.adapter.onUpdate(this._onUpdateAdapter);

                user.getFilteredUserList().then(users => {
                    this._usersInStorage = users;
                });

                this.getUsers();
            }

            $onDestroy() {
                super.$onDestroy();
                this.adapter.offUpdate(this._onUpdateAdapter);
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

            onUpdateState() {
                if (this.loading) {
                    return;
                }
                clearTimeout(this._time);
                this._time = setTimeout(() => this.getUsers(), 500);
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
                        this._onSelectUser();
                    });
            }

            /**
             * @return {void}
             */
            login() {
                const newUser = {
                    ...this.selectedUser,
                    userType: this.adapter.type,
                    networkByte: WavesApp.network.code.charCodeAt(0)
                };

                return user.create(newUser, true, true).then(() => {
                    $state.go(user.getActiveState('wallet'));
                }).catch(() => {
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
                    this._priorityMap[this._type] <= this._priorityMap[this.userExisted.userType];
            }

            /**
             * @private
             */
            _onChangeName() {
                const isUnique = this._usersInStorage.some(user => {
                    return user.name === this.selectedUser.name && user.address !== this.selectedUser.address;
                });

                if (this.importForm) {
                    this.importForm.userName.$setValidity('isUnique', !isUnique);
                }
            }

            _onUpdateAdapter = (state) => this.onUpdateState(state);

        }

        return new KeeperCtrl();
    };

    controller.$inject = ['Base', '$scope', '$state', 'user', 'utils'];

    angular.module('app.keeper').controller('KeeperCtrl', controller);
})();
