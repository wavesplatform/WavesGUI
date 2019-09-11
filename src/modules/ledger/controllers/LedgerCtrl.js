(function () {
    'use strict';

    const signatureAdapter = require('@waves/signature-adapter');

    const USERS_COUNT = 5;
    const PRELOAD_USERS_COUNT = 5;
    const MAX_USER_COUNT = 2147483647;

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

        const analytics = require('@waves/event-sender');

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
                this.visibleUsers = [];
                /**
                 * @type {null}
                 */
                this.selectedUser = null;
                /**
                 * @type {number}
                 */
                this.offset = 0;
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
                this.id = '';
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
                 * @type {Object}
                 * @private
                 */
                this._users = {};
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
                analytics.send({ name: 'Import Ledger Click', target: 'ui' });
            }

            /**
             * @param {number} count
             * @return {Promise}
             */
            getUsers(count) {
                this._runLedgerCommand = 'getUsers';
                this.loading = true;
                this.error = false;

                const countUsers = (count || USERS_COUNT) - 1;
                const promise = utils.timeoutPromise(this.adapter.getUserList(this.offset, countUsers), 25000);

                const modalPromise = this.isInit ?
                    Promise.resolve() :
                    modalManager.showLoginByDevice(promise, this.adapter.type);

                return Promise.all([promise, modalPromise])
                    .then(([users]) => {
                        this.isInit = true;
                        this.loading = false;
                        this.error = false;

                        (users || []).forEach(curUser => {
                            this._users[curUser.id] = curUser;
                        });

                        this.showVisibleUsers();
                        this.selectUser();
                        $scope.$digest();
                    })
                    .catch((err = {}) => {
                        const error = { ...err, count };
                        this.loading = false;
                        this.error = error;

                        if (err instanceof RangeError) {
                            this.offset = 0;
                            this.id = '';
                        }

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

                if (!user && !this.selectedUser && this._users[0]) {
                    this.selectedUser = this._users[0];
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

                this.offset = this._normalizeOffset(this.offset - USERS_COUNT);

                if (this._hasUsersInCache(this.offset, this.offset + USERS_COUNT - 1)) {
                    this.showVisibleUsers();
                } else {
                    if (this.loading) {
                        return;
                    }

                    this.getUsers();
                }

                this._calculateDisabled();
            }

            /**
             * @return {void}
             */
            stepRight() {
                if (this.selectDefault || this.disabledRight) {
                    return;
                }

                this.offset = this._normalizeOffset(this.offset + USERS_COUNT);

                if (this._hasUsersInCache(this.offset, this.offset + USERS_COUNT - 1)) {
                    this.showVisibleUsers();
                } else {
                    if (this.loading) {
                        return;
                    }

                    this.getUsers();
                }

                this._calculateDisabled();
            }

            /**
             * {void}
             */
            showVisibleUsers() {
                const tmp = [];

                for (let i = this.offset; i < this.offset + USERS_COUNT; i++) {
                    tmp.push(this._users[i]);
                }

                this.visibleUsers = tmp;
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

            /**
             * @public
             */
            onChangeId() {
                let id = parseInt(this.id, 10);

                if (isNaN(id) || id < 0) {
                    id = 0;
                }

                if (id > MAX_USER_COUNT) {
                    id = MAX_USER_COUNT;
                }

                this.id = String(id);

                this.offset = this._normalizeOffset(id - Math.floor(USERS_COUNT / 2));

                if (this._hasUsersInCache(this.offset, this.offset + USERS_COUNT - 1)) {
                    this.showVisibleUsers();
                    this.selectUser(this._users[id]);
                } else {
                    this.getUsers().then(() => {
                        this.selectUser(this._users[id]);
                    });
                }
            }

            _calculateDisabled(disable) {
                this.disabledLogin = (
                    disable ||
                    this.loading ||
                    !this.selectedUser
                );

                this.disabledRight = (
                    disable ||
                    this.selectDefault ||
                    this.loading ||
                    this.offset === MAX_USER_COUNT - (USERS_COUNT - 1)
                );

                this.disabledLeft = (
                    disable ||
                    this.selectDefault ||
                    this.loading ||
                    this.offset === 0
                );
            }

            _onChangeSelectDefault() {
                if (this.selectDefault) {
                    this.offset = 0;
                    this.selectedUser = this._users[0];
                }

                this._calculateDisabled();
                this.showVisibleUsers();
            }

            /**
             * @private
             */
            _onSelectUser() {
                this.id = this.selectedUser.id;
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

            /**
             * @private
             * @param {number} from
             * @param {number} to
             */
            _hasUsersInCache(from, to) {
                for (let i = from; i <= to; i++) {
                    if (!this._users[i]) {
                        return false;
                    }
                }

                return true;
            }

            /**
             * @private
             * @param {number} offset
             */
            _normalizeOffset(offset) {
                if (offset > MAX_USER_COUNT - (USERS_COUNT - 1)) {
                    return MAX_USER_COUNT - (USERS_COUNT - 1);
                }

                if (offset < 0) {
                    return 0;
                }

                return offset;
            }

        }

        return new LedgerCtrl();
    };

    controller.$inject = ['Base', '$scope', '$state', 'user', 'modalManager', 'utils'];

    angular.module('app.ledger').controller('LedgerCtrl', controller);
})();
