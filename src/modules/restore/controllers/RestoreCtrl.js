(function () {
    'use strict';

    const analytics = require('@waves/event-sender');

    /**
     * @param Base
     * @param $scope
     * @param {User} user
     * @param {app.utils} utils
     * @param {ModalManager} modalManager
     * @return {RestoreCtrl}
     */
    const controller = function (Base, $scope, user, utils, modalManager) {

        class RestoreCtrl extends Base {

            constructor() {
                super($scope);

                this.seedForm = null;
                /**
                 * @type {string}
                 */
                this.address = '';
                /**
                 * @type {string}
                 */
                this.seed = '';
                /**
                 * @type {string}
                 */
                this.name = '';
                /**
                 * @type {string}
                 */
                this.encryptedSeed = '';
                /**
                 * @type {string}
                 */
                this.password = '';
                /**
                 * @type {string}
                 */
                this.restoreType = '';
                /**
                 * @type {boolean}
                 */
                this.saveUserData = true;
                /**
                 * @type {number}
                 */
                this.activeStep = 0;
                /**
                 * @type {boolean}
                 */
                this.isPriorityUserTypeExists = false;
                /**
                 * @type {object | null}
                 */
                this.userExisted = Object.create(null);
                /**
                 * @type {boolean}
                 */
                this.isNameExists = false;
                /**
                 * @type {Array}
                 * @private
                 */
                this._usersInStorage = [];
                /**
                 * @type {string}
                 * @private
                 */
                this._type = 'seed';
                /**
                 * @type {object}
                 * @private
                 */
                this._priorityMap = utils.getImportPriorityMap();

                user.getFilteredUserList().then(users => {
                    this._usersInStorage = users;
                });

                this.observe('seed', this._onChangeSeed);
                this.observeOnce('seedForm', () => {
                    this.receive(utils.observe(this.seedForm, '$valid'), this._onChangeSeed, this);
                });
                this.observe('address', this._onChangeAddress);
                this.observe('name', this._onChangeName);
            }

            showTutorialModals() {
                return modalManager.showTutorialModals();
            }

            async restore() {

                if (!this.saveUserData) {
                    this.password = Date.now().toString();
                } else {
                    analytics.send({ name: 'Import Backup Protect Your Account Continue Click', target: 'ui' });
                }

                const encryptedSeed = new ds.Seed(this.seed, window.WavesApp.network.code).encrypt(this.password);
                const userSettings = user.getDefaultUserSettings({ termsAccepted: false });

                if (!this.name) {
                    this.name = await user.getDefaultUserName();
                }

                const newUser = {
                    userType: this.restoreType,
                    address: this.address,
                    name: this.name,
                    password: this.password,
                    id: this.userId,
                    path: this.userPath,
                    settings: userSettings,
                    saveToStorage: this.saveUserData,
                    encryptedSeed
                };

                const api = ds.signature.getDefaultSignatureApi(newUser);

                return user.create({
                    ...newUser,
                    settings: userSettings.getSettings(),
                    api
                }, true, true);
            }

            resetNameAndPassword() {
                this.name = '';
                this.password = '';
            }

            nextStep() {
                analytics.send({
                    name: 'Import Backup Continue Click',
                    params: { guestMode: !this.saveUserData },
                    target: 'ui'
                });
                if (!this.saveUserData) {
                    return this.restore();
                }
                this.activeStep++;
                analytics.send({ name: 'Import Backup Protect Your Account Show', target: 'ui' });
            }

            importAccounts() {
                return modalManager.showImportAccountsModal();
            }

            /**
             * @private
             */
            _onChangeSeed() {
                if (this.seedForm.$valid) {
                    this.address = new ds.Seed(this.seed, window.WavesApp.network.code).address;
                } else {
                    this.address = '';
                }
            }

            /**
             * @private
             */
            _onChangeAddress() {
                this.userExisted = this._usersInStorage.find(user => user.address === this.address) || null;
                this.isPriorityUserTypeExists =
                    !!this.userExisted &&
                    this._priorityMap[this._type] <= this._priorityMap[this.userExisted.userType];
            }

            _onChangeName() {
                this.isNameExists = this._usersInStorage.some(user => {
                    return user.name === this.name && user.address !== this.address;
                });
            }

        }

        return new RestoreCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', 'utils', 'modalManager'];

    angular.module('app.restore').controller('RestoreCtrl', controller);
})();
