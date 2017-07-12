(function () {
    'use strict';

    function MainMenu($scope, $interval, events, applicationContext, cryptoService, dialogService,
                      notificationService, apiService) {

        const ctrl = this;
        const delayRefresh = 10 * 1000;

        let refreshPromise;

        ctrl.blockHeight = 0;
        ctrl.address = applicationContext.account.address;

        function initializeBackupFields() {
            ctrl.seed = applicationContext.account.seed;
            ctrl.encodedSeed = cryptoService.base58.encode(converters.stringToByteArray(ctrl.seed));
            ctrl.publicKey = applicationContext.account.keyPair.public;
            ctrl.privateKey = applicationContext.account.keyPair.private;
        }

        function buildBackupClipboardText() {
            let text = `Seed: ${ctrl.seed}\n`;
            text += `Encoded seed: ${ctrl.encodedSeed}\n`;
            text += `Private key: ${ctrl.privateKey}\n`;
            text += `Public key: ${ctrl.publicKey}\n`;
            text += `Address: ${ctrl.address}`;

            return text;
        }

        refreshBlockHeight();
        refreshPromise = $interval(refreshBlockHeight, delayRefresh);

        $scope.$on(`$destroy`, () => {
            if (angular.isDefined(refreshPromise)) {
                $interval.cancel(refreshPromise);
                refreshPromise = undefined;
            }
        });

        ctrl.showBackupDialog = showBackupDialog;
        ctrl.showProfileDialog = showProfileDialog;
        ctrl.backup = backup;

        function showProfileDialog() {
            $scope.$broadcast(events.NAVIGATION_CREATE_ALIAS, {});
        }

        function showBackupDialog() {
            initializeBackupFields();
            dialogService.open(`#header-wPop-backup`);
        }

        function backup() {

            const clipboard = new Clipboard(`#backupForm`, {
                text() {
                    return buildBackupClipboardText();
                }
            });

            clipboard.on(`success`, (e) => {
                notificationService.notice(`Account backup has been copied to clipboard`);
                e.clearSelection();
            });

            angular.element(`#backupForm`).click();
            clipboard.destroy();
        }

        function refreshBlockHeight() {
            apiService.blocks.height().then((response) => {
                ctrl.blockHeight = response.height;
                applicationContext.blockHeight = response.height;
            });
        }
    }

    MainMenu.$inject = [
        `$scope`, `$interval`, `navigation.events`, `applicationContext`, `cryptoService`, `dialogService`,
        `notificationService`, `apiService`
    ];

    angular
        .module(`app.navigation`)
        .controller(`mainMenuController`, MainMenu);
})();
