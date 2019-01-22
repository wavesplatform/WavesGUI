(function () {
    'use strict';

    /**
     * @param $q
     * @param $mdDialog
     * @param $timeout
     * @param {User} user
     * @param {ModalManager} modalManager
     * @param {ISeedService} seedService
     * @return {CreateCtrl}
     */
    const controller = function (Base, $scope, $q, $mdDialog, $timeout, user, modalManager, seedService) {

        const PATH = 'modules/create/templates';
        const ORDER_LIST = [
            'createAccount',
            'createAccountData',
            'noBackupNoMoney',
            'backupSeed',
            'confirmBackup'
        ];

        class CreateCtrl extends Base {

            constructor() {
                super($scope);

                this.stepIndex = 0;
                this.password = '';
                this.name = '';
                this.seed = '';
                this.address = '';
                this.seedList = [];
                this.seedIsValid = false;
                this.seedConfirmWasFilled = false;
                this.saveUserData = true;

                this.resetAddress();
            }

            showTutorialModals() {
                return modalManager.showTutorialModals();
            }

            onSeedConfirmFulfilled(isValid) {
                this.seedIsValid = isValid;
                this.seedConfirmWasFilled = true;

                this.observeOnce('stepIndex', this.clearSeedConfirm);
            }

            seedOnTouch() {
                this.seedConfirmWasFilled = false;
            }

            clearSeedConfirm() {
                seedService.clear.dispatch();
                this.seedIsValid = false;
                this.seedConfirmWasFilled = false;
            }

            setActiveSeed(item) {
                const old = tsUtils.find(this.seedList, { active: true });
                if (old) {
                    old.active = false;
                }
                item.active = true;
                this.seed = item.seed;
                this.address = item.address;
            }

            getStepUrl() {
                return `${PATH}/${ORDER_LIST[this.stepIndex]}.html`;
            }

            create() {
                return this._create(true);
            }

            createWithoutBackup() {
                return this._create(false);
            }

            /**
             * @param {number} [index]
             */
            next(index) {

                if (!index) {
                    index = this.stepIndex + 1;
                }

                if (index < 0) {
                    index = this.stepIndex + index;
                }

                if (!ORDER_LIST[index]) {
                    throw new Error('Wrong order list index!');
                } else {
                    return this.checkNext()
                        .then(() => {
                            this.stepIndex = index;
                        });
                }
            }

            checkNext() {
                const step = ORDER_LIST[this.stepIndex];
                if (step === 'noBackupNoMoney') {
                    return this.showBackupWarningPopup();
                }
                return $q.when();
            }

            resetAddress() {
                const list = [];
                for (let i = 0; i < 5; i++) {
                    const seedData = ds.Seed.create();
                    list.push({ seed: seedData.phrase, address: seedData.address });
                }

                this.setActiveSeed(list[0]);
                this.seedList = list;
            }

            showBackupWarningPopup() {
                return modalManager.showCustomModal({
                    templateUrl: 'modules/create/templates/noBackupNoMoney.modal.html',
                    clickOutsideToClose: false,
                    escapeToClose: false
                });
            }

            _create(hasBackup) {
                if (!this.saveUserData) {
                    this.password = Date.now().toString();
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
                }, hasBackup);
            }

        }

        return new CreateCtrl();
    };

    controller.$inject = [
        'Base', '$scope', '$q', '$mdDialog', '$timeout', 'user', 'modalManager', 'seedService'
    ];

    angular.module('app.create').controller('CreateCtrl', controller);
})();
