(function () {
    'use strict';

    angular
        .module('app.navigation')
        .controller('mainMenuController', ['$scope', 'applicationContext', 'cryptoService', 'dialogService', function ($scope, applicationContext, cryptoService, dialogService) {
            var menu = this;

            menu.address = applicationContext.account.address.getDisplayAddress();

            function initializeBackupFields() {
                menu.seed = applicationContext.account.seed;
                menu.encodedSeed = cryptoService.base58.encode(converters.stringToByteArray(menu.seed));
                menu.publicKey = applicationContext.account.keyPair.public;
                menu.privateKey = applicationContext.account.keyPair.private;
            }

            function buildBackupClipboardText() {
                var text = "Seed: " + menu.seed + "\n";
                text += "Encoded seed: " + menu.encodedSeed + "\n";
                text += "Private key: " + menu.privateKey + "\n";
                text += "Public key: " + menu.publicKey + "\n";
                text += "Address: " + menu.address;

                return text;
            }

            menu.showBackupDialog = showBackupDialog;
            menu.backup = backup;

            function showBackupDialog() {
                initializeBackupFields();
                dialogService.open("#header-wPop-backup");
            }

            function backup() {
                var text = buildBackupClipboardText();
                //todo: put this text to clipboard and display a good message
            }
        }]);
})();
