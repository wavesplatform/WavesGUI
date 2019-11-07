(() => {
    'use strict';

    const ds = require('data-service');
    const { libs, seedUtils } = require('@waves/waves-transactions');
    const { keyPair } = libs.crypto;

    /**
     * @param {*} Base
     * @param {ng.ILogService} $log
     * @param {*} $mdDialog
     * @param {*} storageExporter
     * @param {Storage} storage
     */
    const controller = function (Base, $log, $mdDialog, storageExporter, $scope, storage) {
        const SEED_LENGTH = 20;

        class MigrateModalCtrl extends Base {

            /**
             * @type {number}
             */
            step = 0;

            export() {
                const connectProvider = this._getConnectProvider();
                const message = JSON.stringify({ event: 'connect' });

                connectProvider.send(message, {
                    event: 'data',
                    attempts: 3,
                    timeout: 10000
                }).then((result) => {
                    if (!result || result.event !== 'connect') {
                        throw new Error(`Message event is not valid: ${result.event}`);
                    }

                    const publicKeyTo = result.payload;
                    const { publicKey, privateKey } = keyPair(seedUtils.generateNewSeed(SEED_LENGTH));

                    return storageExporter.export(
                        privateKey,
                        publicKeyTo
                    ).then((data) => {
                        return connectProvider.send(JSON.stringify({
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
                        this.step++;
                        $scope.$apply();
                    } else {
                        $log.log('fail', result);
                    }
                }).catch((e) => {
                    $log.error(e);
                });
            }

            cancel() {
                $mdDialog.cancel();
                storage.save('notAutoOpenMigrationModal', true);
            }

            /**
             * @returns {ConnectProvider}
             */
            _getConnectProvider() {
                const origins = WavesApp.isProduction() ?
                    WavesApp.network.migrationOrigins :
                    '*';

                if (WavesApp.isDesktop()) {
                    return new ds.connect.HttpConnectProvider({
                        port: 8888,
                        url: 'http://localhost:8888/connect',
                        origins
                    });
                } else {
                    const childWindow = window.open('https://localhost:8080/migration');

                    return new ds.connect.PostMessageConnectProvider({
                        win: childWindow,
                        mode: 'export',
                        origins
                    });
                }
            }

        }

        return new MigrateModalCtrl();
    };

    controller.$inject = ['Base', '$log', '$mdDialog', 'storageExporter', '$scope', 'storage'];

    angular.module('app.utils').controller('MigrateModalCtrl', controller);
})();
