(function () {
    'use strict';

    const controller = function (getStartedService, $q, $mdDialog) {

        class GetStartedCtrl {

            constructor() {
                this.stepIndex = 4;
                this.password = '';
                this.confirmPassword = '';
                this.moneyInApp = false;
                this.restoreByBackup = false;
                this.agree = false;

                this.resetAddress();
            }

            canConfirm() {
                return !(this.moneyInApp && this.restoreByBackup && this.agree)
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

            checkNext() {
                const step = getStartedService.stepList[this.stepIndex];
                switch (step.name) {
                    case 'backupWarning':
                        return this.showBackupWarningPopup();
                    case 'backupSeedDone':
                        return this.showBackupSeedDonePopup();
                    default:
                        return $q.when();
                }
            }

            resetAddress() {
                this.seed = getStartedService.generator.generateSeed();
                this.address = getStartedService.generator.generateAddress(this.seed);
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

    controller.$inject = ['GetStartedService', '$q', '$mdDialog'];

    angular.module('app.welcome.getStarted').controller('GetStartedCtrl', controller);
})();
