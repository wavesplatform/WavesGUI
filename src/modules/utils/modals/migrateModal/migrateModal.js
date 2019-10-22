// @ts-check

(function () {
    'use strict';

    const ds = require('data-service');
    const { libs, seedUtils } = require('@waves/waves-transactions');
    const { keyPair, sharedKey, messageDecrypt, base64Decode } = libs.crypto;

    /**
     * @param {typeof Base} Base
     * @param {ng.ILogService} $log
     * @param {$mdDialog} $mdDialog
     * @param {StorageImporter} storageImporter
     * @returns {ExportModalCtrl}
     */
    const controller = function (Base, $log, $mdDialog, storageImporter) {
        const SEED_LENGTH = 20;

        class MigrateModalCtrl extends Base {

            /**
             * @todo separate it for new and old client
             */
            mode = window.opener ? 'import' : 'export';

            constructor() {
                super();

                if (WavesApp.isDesktop()) {
                    this.connectProvider = new ds.connect.HttpConnectProvider({
                        port: 8888,
                        url: 'http://localhost:8888/connect'
                    });
                } else {
                    this.connectProvider = new ds.connect.PostMessageConnectProvider({
                        mode: this.mode
                    });
                }

                if (this.mode === 'import') {
                    this._listen();
                }
            }

            export() {
                const message = JSON.stringify({ event: 'connect' });

                this.connectProvider.send(message, {
                    event: 'data',
                    attempts: 3
                }).then((result) => {
                    if (!result || result.event !== 'connect') {
                        throw new Error(`Message event is not valid: ${result.event}`);
                    }

                    const publicKeyTo = result.payload;
                    const { publicKey, privateKey } = this._generateSharedKeyPair(SEED_LENGTH);

                    return storageImporter.export(
                        privateKey,
                        publicKeyTo
                    ).then((data) => {
                        return this.connectProvider.send(JSON.stringify({
                            event: 'data',
                            payload: {
                                publicKey,
                                data
                            }
                        }), { event: 'data' });
                    });
                }).then((result) => {
                    if (result.payload === 'ok') {
                        $log.log('done');
                        this.connectProvider.destroy();
                    } else {
                        $log.log('fail', result);
                    }
                }).catch((e) => {
                    $log.error(e);
                });
            }

            _listen() {
                let privateKeyTo = null;

                this.connectProvider.listen((message) => {
                    return new Promise((resolve, reject) => {
                        if (!message) {
                            return reject();
                        }

                        switch (message.event) {
                            case 'connect': {
                                const { publicKey, privateKey } = this._generateSharedKeyPair(SEED_LENGTH);

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
                                    const data = JSON.parse(
                                        messageDecrypt(
                                            sharedKey(
                                                privateKeyTo,
                                                publicKeyFrom,
                                                'waves_migration_token'
                                            ),
                                            encryptedData
                                        )
                                    );

                                    return storageImporter.import(data).then(() => {
                                        return resolve(JSON.stringify({
                                            event: 'data',
                                            payload: 'ok'
                                        }));
                                    }).catch((e) => {
                                        return reject(String(e));
                                    }).then(() => {
                                        this.connectProvider.destroy();
                                    });
                                } catch (e) {
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

            /**
             * @param {number} seedLength
             * @returns {TKeyPair<string>}
             */
            _generateSharedKeyPair(seedLength) {
                const seed = seedUtils.generateNewSeed(seedLength);

                return keyPair(seed);
            }

        }

        return new MigrateModalCtrl();
    };

    controller.$inject = ['Base', '$log', '$mdDialog', 'storageImporter'];

    angular.module('app.utils').controller('MigrateModalCtrl', controller);
})();
