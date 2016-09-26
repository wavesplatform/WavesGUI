(function () {
    'use strict';

    function MainMenuController($scope, applicationContext, cryptoService, dialogService, notificationService) {
        var menu = this;

        menu.address = applicationContext.account.address.getDisplayAddress();

        function initializeBackupFields() {
            menu.seed = applicationContext.account.seed;
            menu.encodedSeed = cryptoService.base58.encode(converters.stringToByteArray(menu.seed));
            menu.publicKey = applicationContext.account.keyPair.public;
            menu.privateKey = applicationContext.account.keyPair.private;
        }

        function buildBackupClipboardText() {
            var text = 'Seed: ' + menu.seed + '\n';
            text += 'Encoded seed: ' + menu.encodedSeed + '\n';
            text += 'Private key: ' + menu.privateKey + '\n';
            text += 'Public key: ' + menu.publicKey + '\n';
            text += 'Address: ' + menu.address;

            return text;
        }

        menu.showBackupDialog = showBackupDialog;
        menu.backup = backup;

        function showBackupDialog() {
            initializeBackupFields();
            dialogService.open('#header-wPop-backup');
        }

        function backup() {
            var clipboard = new Clipboard('#backupForm', {
                text: function (trigger) {
                    return buildBackupClipboardText();
                }
            });
            clipboard.on('success', function(e) {
                notificationService.notice('Account backup has been copied to clipboard');
                e.clearSelection();
            });
            angular.element('#backupForm').click();
            clipboard.destroy();
        }
    }

    MainMenuController.$inject = ['$scope', 'applicationContext',
        'cryptoService', 'dialogService', 'notificationService'];

    angular
        .module('app.navigation')
        .controller('mainMenuController', MainMenuController);
})();
