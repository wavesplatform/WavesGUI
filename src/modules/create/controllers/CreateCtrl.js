(function () {
    'use strict';

    /**
     * @param $q
     * @param $mdDialog
     * @param $timeout
     * @param {User} user
     * @param {ModalManager} modalManager
     * @param {ISeedService} seedService
     * @param {CopyService} copyService
     * @param {NotificationManager} notificationManager
     * @return {CreateCtrl}
     */
    const controller = function ($q, $mdDialog, $timeout, user, modalManager,
                                 seedService, copyService, notificationManager) {

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

            create() {
                this._create(true);
            }

            createWithoutBackup() {
                this._create(false);
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
                    this.checkNext()
                        .then(() => {
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

            copySeed() {
                if (this.seed) {
                    copyService.copy(this.seed);
                    notificationManager.info({
                        ns: 'app.create',
                        title: { literal: 'backupSeed.seedCopied' }
                    });
                } else {
                    // TODO : is this conditional branch needed?
                    notificationManager.error({
                        ns: 'app.create',
                        title: { literal: 'backupSeed.noSeedToCopy' }
                    });
                }
            }

            resetAddress() {
                const list = [];
                for (let i = 0; i < 5; i++) {
                    const seedData = Waves.Seed.create();
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
                const seedData = Waves.Seed.fromExistingPhrase(this.seed);
                const encryptedSeed = seedData.encrypt(this.password);
                const publicKey = seedData.keyPair.publicKey;

                return user.create({
                    address: this.address,
                    password: this.password,
                    encryptedSeed,
                    publicKey
                }, hasBackup);
            }

        }

        return new CreateCtrl();
    };

    controller.$inject = [
        '$q', '$mdDialog', '$timeout', 'user', 'modalManager', 'seedService', 'copyService', 'notificationManager'
    ];

    angular.module('app.create').controller('CreateCtrl', controller);
})();
