(function () {
    'use strict';

    const analytics = require('@waves/event-sender');
    const { validators } = require('@waves/waves-transactions');
    const { isPublicKey } = validators;
    const TABS = {
        seed: 'seed',
        key: 'key'
    };

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
                $scope.TABS = TABS;

                this.seedForm = null;
                this.keyForm = null;
                /**
                 * @type {string}
                 */
                this.seed = '';
                /**
                 * @type {string}
                 */
                this.key = '';
                /**
                 * @type {string}
                 */
                this.address = '';
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
                 * @type {boolean}
                 */
                this.saveUserData = true;
                /**
                 * @type {number}
                 */
                this.activeStep = 0;
                /**
                 * @type {string[]}
                 */
                this.tabs = Object.keys(TABS).map(key => TABS[key]);
                /**
                 * @type {string}
                 */
                this.activeTab = TABS.seed;

                this.observe('seed', this._onChangeSeed);
                this.observeOnce('seedForm', () => {
                    this.receive(utils.observe(this.seedForm, '$valid'), this._onChangeSeed, this);
                });
                this.observe('key', this._onChangeKey);
                this.observeOnce('keyForm', () => {
                    this.receive(utils.observe(this.keyForm, '$valid'), this._onChangeKey, this);
                });
                this.observe('activeTab', this._onChangeActiveTab);
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

                const { phrase, type } = this._getPhraseAndType();
                const encryptedSeed = new ds.Seed(phrase, window.WavesApp.network.code).encrypt(this.password);
                const userSettings = user.getDefaultUserSettings({ termsAccepted: false });

                const newUser = {
                    userType: type,
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
             * @param {string} tab
             */
            setActiveTab(tab) {
                this.activeTab = tab;
            }

            /**
             * @private
             */
            _onChangeSeed() {
                if (this.seedForm && this.seedForm.$valid) {
                    this.address = new ds.Seed(this.seed, window.WavesApp.network.code).address;
                } else {
                    this.address = '';
                }
            }

            /**
             * @private
             */
            _onChangeKey() {
                if (this.keyForm && this.keyForm.$valid && isPublicKey(this.key)) {
                    this.address = new ds.Seed(this.key, window.WavesApp.network.code).address;
                } else {
                    this.address = '';
                }
            }

            /**
             * @private
             */
            _onChangeActiveTab() {
                const tab = this.activeTab[0].toUpperCase() + this.activeTab.substring(1);
                this[`_onChange${tab}`]();
            }

            /**
             * @return {{phrase: string, type: string}}
             * @private
             */
            _getPhraseAndType() {
                switch (this.activeTab) {
                    case TABS.key:
                        return ({
                            phrase: this.key,
                            type: 'privateKey'
                        });
                    default:
                        return ({
                            phrase: this.seed,
                            type: 'seed'
                        });
                }
            }

        }

        return new RestoreCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', 'utils', 'modalManager'];

    angular.module('app.restore').controller('RestoreCtrl', controller);
})();
