(function () {
    'use strict';

    var WALLET_NAME_MAXLENGTH = 16;

    function AccountRegisterController($scope, accountService, cryptoService, loginContext) {
        var ctrl = this;

        ctrl.validationOptions = {
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
        ctrl.saveAccountAndSignIn = saveAccountAndSignIn;
        ctrl.cancel = cancel;
        ctrl.seed = function (seed) {
            return arguments.length ? (loginContext.seed = seed) : loginContext.seed;
        };

        function cleanup() {
            ctrl.name = '';
            ctrl.password = '';
            ctrl.confirmPassword = '';
        }

        function saveAccountAndSignIn(form) {
            if (!form.validate()) {
                return false;
            }

            var seed = loginContext.seed;
            var cipher = cryptoService.encryptWalletSeed(seed, ctrl.password).toString();
            var keys = cryptoService.getKeyPair(seed);
            var checksum = cryptoService.seedChecksum(seed);
            var address = cryptoService.buildRawAddress(keys.public);

            var account = {
                name: ctrl.name,
                cipher: cipher,
                checksum: checksum,
                publicKey: keys.public,
                address: address
            };

            accountService.addAccount(account);

            loginContext.notifySignedIn($scope, address, seed, keys);

            cleanup();

            return true;
        }

        function cancel() {
            loginContext.showAccountsListScreen($scope);
            cleanup();
        }
    }

    AccountRegisterController.$inject = ['$scope', 'accountService', 'cryptoService', 'loginContext'];

    angular
        .module('app.login')
        .controller('accountRegisterController', AccountRegisterController);
})();
