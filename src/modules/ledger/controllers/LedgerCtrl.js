(function () {
    'use strict';

    const signatureAdapter = require('@waves/signature-adapter');

    const USERS_COUNT = 5;
    const PRELOAD_USERS_COUNT = 5;

    /**
     * @param {typeof Base} Base
     * @param {ng.IScope} $scope
     * @param {*} $state
     * @param {User} user
     * @param {ModalManager} modalManager
     * @param {app.utils} utils
     * @return {LedgerCtrl}
     */
    const controller = function (Base, $scope, $state, user, modalManager, utils) {

        class LedgerCtrl extends Base {

            constructor() {
                super($scope);
                /**
                 * @type {LedgerAdapter}
                 */
                this.adapter = signatureAdapter.LedgerAdapter;
                /**
                 * @type {boolean}
                 */
                this.loading = false;
                /**
                 * @type {boolean}
                 */
                this.error = false;
                /**
                 * @type {Array}
                 */
                this.users = [];
                /**
                 * @type {Array}
                 */
                this.visibleUsers = [];
                /**
                 * @type {null}
                 */
                this.selectedUser = null;
                /**
                 * @type {number}
                 */
                this.currentStep = 0;
                /**
                 * @type {boolean}
                 */
                this.isInit = false;
                /**
                 * @type {boolean}
                 */
                this.disabledLogin = true;
                /**
                 * @type {boolean}
                 */
                this.disabledRight = true;
                /**
                 * @type {boolean}
                 */
                this.disabledLeft = true;
                /**
                 * @type {boolean}
                 */
                this.selectDefault = false;
                /**
                 * @type {boolean}
                 */
                this.saveUserData = true;
                /**
                 * @type {string}
                 */
                this.name = '';
                /**
                 * @type {string}
                 * @private
                 */
                this._runLedgerCommand = '';
                /**
                 * @type {Array}
                 * @private
                 */
                this._usersInStorage = [];
                /**
                 * @type {boolean}
                 */
                this.isPriorityUserTypeExists = false;
                /**
                 * @type {string}
                 * @private
                 */
                this._type = 'ledger';
                /**
                 * @type {object | null}
                 */
                this.userExisted = Object.create(null);
                /**
                 * @type {object}
                 * @private
                 */
                this._priorityMap = utils.getImportPriorityMap();

                Promise.all([
                    user.getFilteredUserList(),
                    user.getMultiAccountUsers()
                ]).then(([legacyUsers = [], users = []]) => {
                    this._usersInStorage = [...legacyUsers, ...users];
                });

                this.observe('selectDefault', this._onChangeSelectDefault);
                this.getUsers(PRELOAD_USERS_COUNT);
                this.observe('selectedUser', this._onSelectUser);
                this.observe('name', this._onChangeName);
            }

            /**
             * @param count
             * @return {void}
             */
            getUsers(count) {
                this._runLedgerCommand = 'getUsers';
                this.loading = true;
                this.error = false;
                const start = this.users.length;
                const countUsers = (count || USERS_COUNT) - 1;
                const promise = utils.timeoutPromise(this.adapter.getUserList(start, countUsers), 25000);

                const modalPromise = this.isInit ?
                    Promise.resolve() :
                    modalManager.showLoginByDevice(promise, this.adapter.type);

                Promise.all([promise, modalPromise])
                    .then(([users]) => {
                        this.isInit = true;
                        this.users = [...this.users, ...users];
                        this.loading = false;
                        this.error = false;
                        this.showVisibleUsers();
                        this.selectUser();
                        $scope.$digest();
                    })
                    .catch((err = {}) => {
                        const error = { ...err, count };
                        this.loading = false;
                        this.error = error;
                        $scope.$digest();
                        throw error;
                    });
            }

            /**
             * {void}
             */
            retryGetUsers() {
                this[this._runLedgerCommand](this.error && this.error.count);
            }

            /**
             * @param [user]
             * @param user.id
             * @param user.path
             * @param user.address
             * @param user.publicKey
             * @return {null}
             */
            selectUser(user) {
                if (this.selectDefault) {
                    return null;
                }

                if (!user && !this.selectedUser && this.users.length) {
                    this.selectedUser = this.users[0];
                    // } else if (this.selectedUser === user) {
                    //     this.selectedUser = null;
                } else if (user) {
                    this.selectedUser = user;
                }

                this._calculateDisabled();

            }

            /**
             * @return {void}
             */
            stepLeft() {
                if (this.selectDefault || this.disabledLeft) {
                    return;
                }
                this.currentStep--;
                this.currentStep = this.currentStep >= 0 ? this.currentStep : 0;
                this.showVisibleUsers();
                this._calculateDisabled();
            }

            /**
             * @return {void}
             */
            stepRight() {
                if (this.selectDefault || this.disabledRight) {
                    return;
                }

                if (this.users.length <= this.currentStep + USERS_COUNT) {
                    if (this.loading) {
                        return;
                    }
                    this.currentStep++;
                    this.getUsers();
                    this._calculateDisabled();
                } else {
                    this.currentStep++;
                    this.showVisibleUsers();
                    this._calculateDisabled();
                }
            }

            /**
             * {void}
             */
            showVisibleUsers() {
                this.visibleUsers = this.users.slice(this.currentStep, this.currentStep + USERS_COUNT);
            }

            /**
             * @return {void}
             */
            login() {
                this._runLedgerCommand = 'login';

                const newUser = {
                    ...this.selectedUser,
                    userType: this.adapter.type,
                    name: this.name,
                    networkByte: WavesApp.network.code.charCodeAt(0)
                };

                this._calculateDisabled(true);

                return user.create(newUser, true, true).then(() => {
                    $state.go(user.getActiveState('wallet'));
                }).catch(() => {
                    this.error = true;
                    $scope.$digest();
                });
            }

            /**
             * @param {number} index
             * @return {boolean}
             */
            isUserDisable(index) {
                return index !== 0 && this.selectDefault;
            }

            _calculateDisabled(disable) {
                // const limitRight = this.users.length < this.currentStep + USERS_COUNT + 1;
                this.disabledLogin = disable || this.loading || !this.selectedUser;
                this.disabledRight = disable || this.selectDefault || this.loading;
                this.disabledLeft = disable || this.selectDefault || this.loading || this.currentStep === 0;
            }

            _onChangeSelectDefault() {
                if (this.selectDefault) {
                    this.currentStep = 0;
                    this.selectedUser = this.users[0];
                }
                this._calculateDisabled();
                this.showVisibleUsers();
            }

            /**
             * @private
             */
            _onSelectUser() {
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
                    return user.name === this.name && user.address !== this.selectedUser.address;
                });
                this.importForm.userName.$setValidity('isUnique', !isUnique);
            }

        }

        return new LedgerCtrl();
    };

    controller.$inject = ['Base', '$scope', '$state', 'user', 'modalManager', 'utils'];

    angular.module('app.ledger').controller('LedgerCtrl', controller);
})();
