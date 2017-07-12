(function () {
    'use strict';

    class Home {

        constructor($scope, $timeout, $window, applicationConstants, utilsService, dialogService, notificationService) {

            this.$window = $window;
            this.dialogService = dialogService;
            this.notificationService = notificationService;

            this.initialize(applicationConstants, utilsService, $timeout, $scope);
        }

        initialize(applicationConstants, utilsService, $timeout, $scope) {
            const titlePrefix = utilsService.isTestnet() ? `TESTNET ` : ``;

            $scope.isTestnet = utilsService.isTestnet;
            $scope.clipboardOk = this.clipboardOk.bind(this);
            this.loading = true;

            this.title = `${titlePrefix}Lite Client`;
            this.version = applicationConstants.CLIENT_VERSION;

            $timeout(() => {
                this.loading = false;
            }, 1);
        }

        clipboardOk(message) {
            message = message || `Address copied successfully`;
            this.notificationService.notice(message);
        }

        featureUnderDevelopment() {
            this.dialogService.open(`#feat-not-active`);
        }

        logout() {
            const window = this.$window;
            if (window.chrome && window.chrome.runtime && typeof window.chrome.runtime.reload === `function`) {
                window.chrome.runtime.reload();
            } else {
                window.location.reload();
            }
        }

    }

    Home.$inject = [
        `$scope`, `$timeout`, `$window`, `constants.application`, `utilsService`,
        `dialogService`, `notificationService`
    ];

    angular
        .module(`app.ui`)
        .controller(`homeController`, Home);
})();
