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

                this.observe('seed', this._onChangeSeed);
                this.observeOnce('seedForm', () => {
                    this.receive(utils.observe(this.seedForm, '$valid'), this._onChangeSeed, this);
                });
            }

            showTutorialModals() {
                return modalManager.showTutorialModals();
            }

            restore() {

                if (!this.saveUserData) {
                    this.password = Date.now().toString();
                } else {
                    analytics.send({ name: 'Import Backup Protect Your Account Continue Click', target: 'ui' });
                }

                const encryptedSeed = new ds.Seed(this.seed).encrypt(this.password);
                const userSettings = user.getDefaultUserSettings({ termsAccepted: false });

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
                if (!this.saveUserData) {
                    return this.restore();
                }
                analytics.send({ name: 'Import Backup Protect Your Account Show', target: 'ui' });
                this.activeStep++;
            }

            importAccounts() {
                return modalManager.showImportAccountsModal();
            }

            /**
             * @private
             */
            _onChangeSeed() {
                if (this.seedForm.$valid) {
                    this.address = new ds.Seed(this.seed).address;
                } else {
                    this.address = '';
                }
            }

        }

        return new RestoreCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', 'utils', 'modalManager'];

    angular.module('app.restore').controller('RestoreCtrl', controller);
})();
