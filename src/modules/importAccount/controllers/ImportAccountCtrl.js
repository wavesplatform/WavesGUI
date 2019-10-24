// @ts-check

(() => {
    'use strict';

    const ds = require('data-service');
    const { libs, seedUtils } = require('@waves/waves-transactions');
    const { keyPair, sharedKey, messageDecrypt, base64Decode } = libs.crypto;

    /**
     * @param {*} Base
     * @param {ng.IScope} $scope
     * @param {*} user
     * @param {*} multiAccount
     * @param {*} storageImporter
     */
    const controller = function (Base, $scope, user, multiAccount, storageImporter) {
        const SEED_LENGTH = 20;

        class ImportAccountCtrl extends Base {

            /**
             * @type {'idle' | 'progress' | 'ready' | 'success' | 'error'}
             */
            status = 'idle';

            /**
             * @type {boolean}
             */
            hasAccount = false;

            /**
             * @type {Object}
             */
            data = null;

            constructor() {
                super($scope);

                if (WavesApp.isDesktop()) {
                    this.connectProvider = new ds.connect.HttpConnectProvider({
                        port: 8888,
                        url: 'http://localhost:8888/connect'
                    });
                } else {
                    this.connectProvider = new ds.connect.PostMessageConnectProvider({
                        mode: 'import'
                    });
                }

                user.getMultiAccountData().then((multiAccountData) => {
                    if (multiAccountData) {
                        this.hasAccount = true;
                    } else {
                        this._listen();
                    }
                });
            }

            importAccount() {
                storageImporter.import(this.data).then(() => {
                    this.status = 'success';
                    $scope.$digest();
                }).catch(() => {
                    this.status = 'error';
                    $scope.$digest();
                });
            }

            async login() {
                if (!multiAccount.isSignedIn) {
                    const multiAccountData = await user.getMultiAccountData();
                    const multiAccountHash = await user.getMultiAccountHash();

                    await multiAccount.signIn(
                        multiAccountData,
                        this.data.password,
                        user.getSetting('encryptionRounds'),
                        multiAccountHash
                    );
                }

                const [firstUser] = await user.getMultiAccountUsers();

                if (firstUser) {
                    user.logout('switch', true);
                    await user.login(firstUser);
                    user.goToActiveState();
                } else {
                    this.$state.go('create');
                }
            }

            onSignIn() {
                this._listen();
            }

            onResetPassword() {
                throw new Error('ImportAccountCtrl.onResetPassword() not implemented');
            }

            /**
             * @private
             */
            _listen() {
                let privateKeyTo = null;
                this.status = 'progress';

                this.connectProvider.listen((message) => {
                    return new Promise((resolve, reject) => {
                        if (!message) {
                            return reject();
                        }

                        switch (message.event) {
                            case 'connect': {
                                const { publicKey, privateKey } = keyPair(
                                    seedUtils.generateNewSeed(SEED_LENGTH)
                                );

                                privateKeyTo = privateKey;

                                return resolve(JSON.stringify({
                                    event: 'connect',
                                    payload: publicKey
                                }));
                            }
                            case 'data': {
                                const encryptedData = base64Decode(message.payload.data);
                                const publicKeyFrom = message.payload.publicKey;

                                if (!privateKeyTo) {
                                    return reject('Key pair does not exist');
                                }

                                try {
                                    this.data = JSON.parse(
                                        messageDecrypt(
                                            sharedKey(
                                                privateKeyTo,
                                                publicKeyFrom,
                                                'waves_migration_token'
                                            ),
                                            encryptedData
                                        )
                                    );

                                    this.status = 'ready';

                                    return resolve(JSON.stringify({
                                        event: 'data',
                                        payload: 'ok'
                                    }));
                                } catch (e) {
                                    this.status = 'error';

                                    return reject(String(e));
                                } finally {
                                    privateKeyTo = null;
                                }
                            }
                            default: return reject('Invalid message');
                        }
                    });
                });
            }

        }

        return new ImportAccountCtrl();
    };

    controller.$inject = [
        'Base',
        '$scope',
        'user',
        'multiAccount',
        'storageImporter'
    ];

    angular.module('app.importAccount').controller('ImportAccountCtrl', controller);
})();
