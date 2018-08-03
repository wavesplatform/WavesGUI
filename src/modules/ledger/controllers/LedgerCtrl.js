(function () {
    'use strict';

    const signatureAdapter = require('@waves/waves-signature-adapter');

    const USERS_COUNT = 5;
    const PRELOAD_USERS_COUNT = 5;

    /**
     * @param Base
     * @param $scope
     * @param {User} user
     * @param {modalManager} modalManager
     * @return {LedgerCtrl}
     */
    const controller = function (Base, $scope, user, modalManager) {

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

                this.observe('selectDefault', this._onChangeSelectDefault);
                this.getUsers(PRELOAD_USERS_COUNT);
            }

            /**
             * @param count
             * @return {void}
             */
            getUsers(count) {
                this.loading = true;
                this.error = false;
                const start = this.users.length;
                const end = start + (count || USERS_COUNT) - 1;
                const promise = this.adapter.getUserList(start, end).then(
                    (users) => {
                        this.isInit = true;
                        this.users = [...this.users, ...users];
                        this.loading = false;
                        this.error = false;
                        this.showVisibleUsers();
                        this.selectUser();
                        $scope.$digest();
                    },
                    (err = {}) => {
                        const error = { ...err, count };
                        this.loading = false;
                        this.error = error;
                        modalManager.showLedgerError({ error: 'sign-matcher-error' });
                        $scope.$digest();
                        throw error;
                    }
                );

                if (!this.isInit) {
                    modalManager.showSignLedger({ promise, mode: 'connect' });
                }
            }

            /**
             * {void}
             */
            retryGetUsers() {
                this.getUsers(this.error && this.error.count);
            }

            /**
             * @param user
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
                } else if (this.selectedUser === user) {
                    this.selectedUser = null;
                } else if (user) {
                    this.selectedUser = user;
                }

                this._calculateDisabled();

            }

            /**
             * @return {void}
             */
            stepLeft() {
                if (this.selectDefault) {
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
                if (this.selectDefault) {
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
                const userSettings = user.getDefaultUserSettings({ termsAccepted: false });
                const newUser = {
                    ...this.selectedUser,
                    userType: this.adapter.type,
                    name: this.name,
                    settings: userSettings,
                    saveToStorage: this.saveUserData
                };

                this._calculateDisabled(true);
                const api = ds.signature.getDefaultSignatureApi(newUser);

                return user.create({
                    ...newUser,
                    settings: userSettings.getSettings(),
                    api
                }, true, true);
            }

            /**
             * @param {number} index
             * @return {boolean}
             */
            isUserDisable(index) {
                return index !== 0 && this.selectDefault;
            }

            _calculateDisabled(disable) {
                const limitRight = this.users.length < this.currentStep + USERS_COUNT + 1;
                this.disabledLogin = disable || this.loading || !this.selectedUser;
                this.disabledRight = disable || this.selectDefault || limitRight;
                this.disabledLeft = disable || this.selectDefault || this.currentStep === 0;
            }

            _onChangeSelectDefault() {
                if (this.selectDefault) {
                    this.currentStep = 0;
                    this.selectedUser = this.users[0];
                }
                this._calculateDisabled();
                this.showVisibleUsers();
            }

        }

        return new LedgerCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', 'modalManager'];

    angular.module('app.ledger').controller('LedgerCtrl', controller);
})();
