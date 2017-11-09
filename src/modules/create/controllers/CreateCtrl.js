(function () {
    'use strict';

    /**
     * @param $q
     * @param $mdDialog
     * @param {app.utils.apiWorker} apiWorker
     * @param $timeout
     * @param {User} user
     * @param {ModalManager} modalManager
     * @param {ISeedService} seedService
     * @return {CreateCtrl}
     */
    const controller = function ($q, $mdDialog, apiWorker, $timeout, user, modalManager, seedService) {

        const PATH = 'modules/create/templates';
        const ORDER_LIST = [
            'createAccount',
            'noBackupNoMoney',
            'backupSeed',
            'confirmBackup'
        ];

        class CreateCtrl {

            constructor() {
                this.stepIndex = 0;
                this.password = '';
                this.seed = '';
                this.address = '';
                this.seedList = [];
                this.seedIsValid = false;
                this.seedConfirmWasFilled = false;

                this.resetAddress();
            }

            onSeedConfirmFulfilled(isValid) {
                this.seedIsValid = isValid;
                this.seedConfirmWasFilled = true;
            }

            clearSeedConfirm() {
                seedService.clear.dispatch();
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
                    const workerData = { seed: this.seed, password: this.password };
                    const workerHandler = (Waves, data) => {
                        const seedData = Waves.Seed.fromExistingPhrase(data.seed);
                        return seedData.encrypt(data.password);
                    };

                    apiWorker.process(workerHandler, workerData)
                        .then((encryptedSeed) => {
                            return user.addUserData({
                                address: this.address,
                                password: this.password,
                                encryptedSeed,
                                settings: {
                                    termsAccepted: false
                                }
                            });
                        });
                } else {
                    this.checkNext().then(() => {
                        this.stepIndex = index;
                    });
                }
            }

            checkNext() {
                const step = ORDER_LIST[this.stepIndex];
                switch (step) {
                    case 'noBackupNoMoney':
                        return this.showBackupWarningPopup();
                    default:
                        return $q.when();
                }
            }

            resetAddress() {
                apiWorker.process((Waves) => {
                    const list = [];
                    for (let i = 0; i < 5; i++) {
                        const seedData = Waves.Seed.create();
                        list.push({ seed: seedData.phrase, address: seedData.address });
                    }
                    return list;
                }).then((data) => {
                    this.setActiveSeed(data[0]);
                    this.seedList = data;
                });
            }

            showBackupWarningPopup() {
                return modalManager.showCustomModal({
                    templateUrl: 'modules/create/templates/noBackupNoMoney.modal.html',
                    clickOutsideToClose: false,
                    escapeToClose: false
                });
            }

        }

        return new CreateCtrl();

    };

    controller.$inject = ['$q', '$mdDialog', 'apiWorker', '$timeout', 'user', 'modalManager', 'seedService'];

    angular.module('app.create').controller('CreateCtrl', controller);
})();
