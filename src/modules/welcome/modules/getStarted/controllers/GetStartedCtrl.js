(function () {
    'use strict';

    const controller = function (getStartedService, $q, $mdDialog, GET_STARTED_CONFIG) {

        class GetStartedCtrl {

            constructor() {
                this.stepIndex = 1;
                this.password = '';
                this.confirmPassword = '';

                this.resetAddress();
            }

            getStepUrl() {
                return getStartedService.stepList[this.stepIndex].url;
            }

            next() {
                this.checkNext().then(() => {
                    this.stepIndex++;
                });
            }

            checkNext() {
                const step = getStartedService.stepList[this.stepIndex];
                switch (step.name) {
                    case 'backupWarning':
                        return this.showBackupWarningPopup();
                    default:
                        return $q.when();
                }
            }

            resetAddress() {
                this.seed = getStartedService.generator.generateSeed();
                this.address = getStartedService.generator.generateAddress(this.seed);
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
