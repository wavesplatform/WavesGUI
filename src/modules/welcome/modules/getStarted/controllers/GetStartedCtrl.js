(function () {
    'use strict';

    const controller = function ($q, $mdDialog, apiWorker, $timeout, $state, user) {

        const PATH = 'modules/welcome/modules/getStarted/templates';
        const ORDER_LIST = [
            'createAccount',
            'backupEnter',
            'backupWarning',
            'backupSeed',
            'backupSeedRepeat',
            'backupSeedDone',
            'end'
        ];

        class GetStartedCtrl {

            constructor() {
                this.stepIndex = 0;
                this.password = '';
                this.confirmPassword = '';
                this.moneyInApp = false;
                this.restoreByBackup = false;
                this.hasAccount = false;
                this.agree = false;
                this.seed = '';
                this.address = '';
                this.seedList = [];

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

            canConfirm() {
                return !(this.moneyInApp && this.restoreByBackup && this.agree);
            }

            getStepUrl() {
                return `${PATH}/${ORDER_LIST[this.stepIndex]}.html`;
            }

            clear() {
                // TODO ???
            }

            next(index) {
                this.checkNext().then(() => {
                    if (index == null) {
                        if (ORDER_LIST[this.stepIndex + 1]) {
                            this.stepIndex++;
                        } else {

                            const workerData = { seed: this.seed, password: this.password };
                            const workerHandler = (waves, data) => {
                                const seedData = waves.Seed.fromExistingPhrase(data.seed);
                                return seedData.encrypt(data.password);
                            };

                            apiWorker.process(workerHandler, workerData)
                                .then((encryptedSeed) => {
                                    return user.setUserData({
                                        address: this.address,
                                        encryptedSeed
                                    });
                                });
                        }
                    } else {
                        this.stepIndex = index;
                    }
                });
            }

            back() {
                if (this.stepIndex) {
                    this.stepIndex = this.stepIndex - 1;
                } else {
                    $state.go('welcome');
                }
            }

            checkNext() {
                const step = ORDER_LIST[this.stepIndex];
                switch (step) {
                    case 'createAccount':
                        return this.showCreateAccountAnimation();
                    case 'backupWarning':
                        return this.showBackupWarningPopup();
                    case 'backupSeedDone':
                        return this.showBackupSeedDonePopup();
                    default:
                        return $q.when();
                }
            }

            showCreateAccountAnimation() {
                this.hasAccount = true;
                return $timeout(() => ({}), 1000);
            }

            resetAddress() {
                apiWorker.process((waves) => {
                    const list = [];
                    for (let i = 0; i < 5; i++) {
                        const seedData = waves.Seed.create();
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
                return $mdDialog.show(
                    $mdDialog.alert()
                        .parent(angular.element(document.body))
                        .clickOutsideToClose(false)
                        .title('Screenshots are not secure')
                        .textContent('...')
                        .ok('I understand')
                );
            }

        }

        return new GetStartedCtrl();

    };

    controller.$inject = ['$q', '$mdDialog', 'apiWorker', '$timeout', '$state', 'user'];

    angular.module('app.welcome.getStarted').controller('GetStartedCtrl', controller);
})();
