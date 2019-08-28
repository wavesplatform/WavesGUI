(function () {
    'use strict';

    const analytics = require('@waves/event-sender');
    const { validators, libs } = require('@waves/waves-transactions');
    const { isPublicKey } = validators;
    const { address, publicKey } = libs.crypto;
    const TABS = {
        seed: 'seed',
        key: 'key'
    };

    /**
     * @param Base
     * @param {ng.IScope} $scope
     * @param {*} $state
     * @param {User} user
     * @param {app.utils} utils
     * @param {ModalManager} modalManager
     * @return {RestoreCtrl}
     */
    const controller = function (Base, $scope, $state, user, utils, modalManager) {

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
                this.tabs = Object.values(TABS);
                /**
                 * @type {string}
                 */
                this.activeTab = TABS.seed;
                /**
                 * @type {boolean}
                 */
                this.isPriorityUserTypeExists = false;
                /**
                 * @type {object | null}
                 */
                this.userExisted = Object.create(null);
                /**
                 * @type {Array}
                 * @private
                 */
                this._usersInStorage = [];
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

                this.observe('seed', this._onChangeSeed);
                this.observeOnce('seedForm', () => {
                    this.receive(utils.observe(this.seedForm, '$valid'), () => {
                        if (this.activeTab === TABS.seed) {
                            this._onChangeSeed();
                        }
                    });
                });
                this.observe('address', this._onChangeAddress);
                this.observe('key', this._onChangeKey);
                this.observeOnce('keyForm', () => {
                    this.receive(utils.observe(this.keyForm, '$valid'), () => {
                        if (this.activeTab === TABS.key) {
                            this._onChangeKey();
                        }
                    });
                });
                this.observe('activeTab', this._onChangeActiveTab);
            }

            showTutorialModals() {
                return modalManager.showTutorialModals();
            }

            restore() {
                if (this.saveUserData) {
                    analytics.send({ name: 'Import Backup Protect Your Account Continue Click', target: 'ui' });
                }

                const { keyOrSeed, type } = this._getEncryptedAndType();

                const newUser = {
                    userType: type,
                    name: this.name,
                    networkByte: WavesApp.network.code.charCodeAt(0),
                    ...keyOrSeed
                };

                return user.create(newUser, true, true).then(() => {
                    $state.go(user.getActiveState('wallet'));
                });
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
                    this._priorityMap[this.activeTab] <= this._priorityMap[this.userExisted.userType];
            }

            /**
             * @private
             */
            _onChangeKey() {
                if (this.keyForm.$valid && isPublicKey(this.key)) {
                    const pubKey = publicKey({ privateKey: this.key });
                    this.address = address({ publicKey: pubKey }, window.WavesApp.network.code);
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
             * @return {{keyOrSeed: {seed: string}, type: string}|{keyOrSeed: {privateKey: string}, type: string}}
             * @private
             */
            _getEncryptedAndType() {
                switch (this.activeTab) {
                    case TABS.key:
                        return ({
                            keyOrSeed: {
                                privateKey: this.key
                            },
                            type: 'privateKey'
                        });
                    default:
                        return ({
                            keyOrSeed: {
                                seed: this.seed
                            },
                            type: 'seed'
                        });
                }
            }

        }

        return new RestoreCtrl();
    };

    controller.$inject = ['Base', '$scope', '$state', 'user', 'utils', 'modalManager'];

    angular.module('app.restore').controller('RestoreCtrl', controller);
})();
