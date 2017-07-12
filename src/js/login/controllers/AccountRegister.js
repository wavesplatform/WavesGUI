(function () {
    'use strict';

    const WALLET_NAME_MAXLENGTH = 16;

    class AccountRegister {
        /**
         * @param $scope
         * @param cryptoService
         * @param {LoginContext} loginContext
         */
        constructor($scope, cryptoService, loginContext) {
            this.loginContext = loginContext;
            this.cryptoService = cryptoService;
            this.$scope = $scope;

            this.validationOptions = _.cloneDeep(AccountRegister.validationOptions);
        }

        /**
         *
         * @param seed
         * @returns {string}
         */
        seed(seed) {
            return seed !== null ? (this.loginContext.seed = seed) : this.loginContext.seed;
        }

        cleanup() {
            this.name = '';
            this.password = '';
            this.confirmPassword = '';
        }

        cancel() {
            this.loginContext.showAccountsListScreen(this.$scope);
            this.cleanup();
        }

        /**
         *
         * @param form
         * @returns {boolean}
         */
        saveAccountAndSignIn(form) {
            if (!form.validate()) {
                return false;
            }

            const seed = this.loginContext.seed;
            const cipher = this.cryptoService.encryptWalletSeed(seed, this.password).toString();
            const keys = this.cryptoService.getKeyPair(seed);
            const checksum = this.cryptoService.seedChecksum(seed);
            const address = this.cryptoService.buildRawAddress(keys.public);

            const account = {
                name: this.name,
                cipher: cipher,
                checksum: checksum,
                publicKey: keys.public,
                address: address
            };

            this.loginContext.addAccount(account);
            this.loginContext.notifySignedIn(address, seed, keys);
        }

    }

    AccountRegister.validationOptions = {
        onfocusout: false,
        rules: {
            walletName: {
                maxlength: WALLET_NAME_MAXLENGTH
            },
            walletPassword: {
                required: true,
                minlength: 8,
                password: true
            },
            walletPasswordConfirm: {
                equalTo: '#walletPassword'
            }
        },
        messages: {
            walletName: {
                maxlength: 'A wallet name is too long. Maximum name length is ' +
                WALLET_NAME_MAXLENGTH + ' characters'
            },
            walletPassword: {
                required: 'A password is required to store your seed safely',
                minlength: 'Password must be 8 characters or longer'
            },
            walletPasswordConfirm: {
                equalTo: 'Passwords do not match'
            }
        }
    };

    AccountRegister.$inject = ['$scope', 'cryptoService', 'loginContext'];

    angular
        .module('app.login')
        .controller('accountRegisterController', AccountRegister);
})();
