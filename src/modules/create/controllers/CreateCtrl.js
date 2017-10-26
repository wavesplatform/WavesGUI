(function () {
    'use strict';

    /**
     * @param $q
     * @param $mdDialog
     * @param {app.utils.apiWorker} apiWorker
     * @param $timeout
     * @param $state
     * @param {User} user
     * @param {ModalManager} modalManager
     * @return {CreateCtrl}
     */
    const controller = function ($q, $mdDialog, apiWorker, $timeout, $state, user, modalManager) {

        const PATH = '/modules/create/templates';
        const ORDER_LIST = [
            'createAccount',
            'noBackupNoMoney',
            'backupSeed',
            'confirmBackup',
            'backupSeedDone',
            'end'
        ];

        class CreateCtrl {

            constructor() {
                this.stepIndex = 0;
                this.password = '';
                this.confirmPassword = '';
                this.seed = '';
                this.address = '';
                this.seedList = [];
                this.seedIsValid = false;
                this.seedIsFull = false;

                this.resetAddress();
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
                if (index < 0) {
                    index = this.stepIndex + index;
                }
                this.checkNext().then(() => {
                    if (index == null) {
                        if (ORDER_LIST[this.stepIndex + 1]) {
                            this.stepIndex++;
                        } else {

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
                                        encryptedSeed
                                    });
                                });
                        }
                    } else {
                        this.stepIndex = index;
                    }
                });
            }

            checkNext() {
                const step = ORDER_LIST[this.stepIndex];
                switch (step) {
                    case 'noBackupNoMoney':
                        return this.showBackupWarningPopup();
                    case 'backupSeedDone':
                        return this.showBackupSeedDonePopup();
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

            showBackupSeedDonePopup() {
                return $mdDialog.show(
                    $mdDialog.alert()
                        .parent(angular.element(document.body))
                        .clickOutsideToClose(false)
                        .title('Screenshots are not secure')
                        .textContent('...')
                        .ok('Got it')
                );
            }

            showBackupWarningPopup() {
                return modalManager.showCustomModal({
                    templateUrl: '/modules/create/templates/noBackupNoMoney.modal.html',
                    clickOutsideToClose: false,
                    escapeToClose: false
                });
            }

        }

        return new CreateCtrl();

    };

    controller.$inject = ['$q', '$mdDialog', 'apiWorker', '$timeout', '$state', 'user', 'modalManager'];

    angular.module('app.create').controller('CreateCtrl', controller);
})();
