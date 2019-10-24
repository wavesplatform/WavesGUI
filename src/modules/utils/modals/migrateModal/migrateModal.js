// @ts-check

(() => {
    'use strict';

    const ds = require('data-service');
    const { libs, seedUtils } = require('@waves/waves-transactions');
    const { keyPair } = libs.crypto;

    /**
     * @param {*} Base
     * @param {ng.ILogService} $log
     * @param {*} $mdDialog
     * @param {*} storageImporter
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
                    const { publicKey, privateKey } = keyPair(seedUtils.generateNewSeed(SEED_LENGTH));

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

        }

        return new MigrateModalCtrl();
    };

    controller.$inject = ['Base', '$log', '$mdDialog', 'storageImporter'];

    angular.module('app.utils').controller('MigrateModalCtrl', controller);
})();
