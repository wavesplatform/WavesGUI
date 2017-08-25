(function () {
    'use strict';

    const controller = function (getStartedService, $q, $mdDialog, apiWorker, $timeout, $state) {

        class GetStartedCtrl {

            constructor() {
                this.stepIndex = 0;
                this.password = '';
                this.confirmPassword = '';
                this.moneyInApp = false;
                this.restoreByBackup = false;
                this.agree = false;
                this.seed = '';
                this.address = '';
                this.seedList = [];

                this.resetAddress();
            }

            setActiveSeed(item) {
                const old = utils.find(this.seedList, { active: true });
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
                return getStartedService.stepList[this.stepIndex].url;
            }

            clear() {
                // TODO ???
            }

            next(index) {
                this.checkNext().then(() => {
                    if (index == null) {
                        this.stepIndex++;
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
                const step = getStartedService.stepList[this.stepIndex];
                switch (step.name) {
                    case 'id':
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
                apiWorker.process((api) => {
                    const list = [];
                    for (let i = 0; i < 5; i++) {
                        list.push({ seed: api.getSeed(), address: api.getAddress() });
                        api.resetSeed();
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

    controller.$inject = ['GetStartedService', '$q', '$mdDialog', 'apiWorker', '$timeout', '$state'];

    angular.module('app.welcome.getStarted').controller('GetStartedCtrl', controller);
})();
