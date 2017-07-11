(function () {
    'use strict';

    class AccountLoginController {

        /**
         * @param $scope
         * @param cryptoService
         * @param {LoginContext} loginContext
         * @param notificationService
         */
        constructor($scope, cryptoService, loginContext, notificationService) {
            this.$scope = $scope;
            this.cryptoService = cryptoService;
            this.loginContext = loginContext;
            this.notificationService = notificationService;
        }

        signIn() {
            this._performSignIn();
            this._cleanup();
        }

        cancel() {
            this.loginContext.showAccountsListScreen(this.$scope);
            this._cleanup();
        }

        /**
         * @private
         */
        _cleanup() {
            this.password = '';
        }

        /**
         * @private
         */
        _performSignIn() {
            const account = this.loginContext.currentAccount;
            if (angular.isUndefined(account)) {
                throw new Error('Account to log in hasn\'t been selected');
            }

            const decryptedSeed = this.cryptoService.decryptWalletSeed(account.cipher, this.password, account.checksum);
            if (!decryptedSeed) {
                this.notificationService.error('Wrong password! Please try again.');
            } else {
                const keys = this.cryptoService.getKeyPair(decryptedSeed);
                this.loginContext.notifySignedIn(account.address, decryptedSeed, keys);
            }
        }

    }

    AccountLoginController.$inject = [
        '$scope', 'cryptoService', 'loginContext', 'notificationService'
    ];

    angular
        .module('app.login')
        .controller('accountLoginController', AccountLoginController);
})();
