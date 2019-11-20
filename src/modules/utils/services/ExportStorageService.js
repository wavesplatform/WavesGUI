(() => {
    'use strict';

    const { libs, seedUtils } = require('@waves/waves-transactions');
    const { keyPair } = libs.crypto;

    const noop = () => undefined;
    const SEED_LENGTH = 20;

    class ExportStorageService {

        static $inject = ['storageExporter'];

        _onConnectResolve = noop;
        _onConnectReject = noop;
        _onDataResolve = noop;
        _onDataReject = noop;
        /**
         * @type {ConnectProvider}
         * @private
         */
        _provider = null;

        constructor(storageExporter) {
            this._storageExporter = storageExporter;
        }

        _connectPromise = new Promise((resolve, reject) => {
            this._onConnectResolve = resolve;
            this._onConnectReject = reject;
        });

        _dataPromise = new Promise((resolve, reject) => {
            this._onDataResolve = resolve;
            this._onDataReject = reject;
        });

        onConnect() {
            return this._connectPromise;
        }

        onData() {
            return this._dataPromise;
        }

        /**
         * @type public
         * @param provider
         * @param attempts
         * @param timeout
         */
        export({ provider, attempts, timeout }) {
            this._dataPromise = new Promise((resolve, reject) => {
                this._onDataResolve = resolve;
                this._onDataReject = reject;
            });
            this.destroy();

            this._provider = provider;
            const message = JSON.stringify({ event: 'connect' });

            this._provider.send(message, {
                event: 'data',
                attempts,
                timeout
            }).then((result) => {
                if (!result || result.event !== 'connect') {
                    this._onConnectReject();
                    throw new Error(`Message event is not valid: ${result.event}`);
                }
                this._onConnectResolve();

                const publicKeyTo = result.payload;
                const { publicKey, privateKey } = keyPair(seedUtils.generateNewSeed(SEED_LENGTH));

                return this._storageExporter.export(
                    privateKey,
                    publicKeyTo
                ).then((data) => {
                    return this._provider.send(JSON.stringify({
                        event: 'data',
                        payload: {
                            publicKey,
                            data
                        }
                    }), { event: 'data' });
                });
            }).then((result) => {
                if (result.payload === 'ok') {
                    this._onDataResolve(result);
                } else {
                    this._onDataReject();
                }
            })
                .catch(error => {
                    this._onConnectReject(error);
                });
        }

        destroy() {
            if (this._provider) {
                this._provider.destroy();
            }
        }

    }

    angular.module('app').service('exportStorageService', ExportStorageService);
})();
