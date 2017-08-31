(function () {
    'use strict';

    const factory = function (utils) {


        const getWawesApi = function (network) {
            return WavesAPI.create({
                networkByte: network.code.charCodeAt(0),
                nodeAddress: network.server,
                matcherAddress: network.matcher
            });
        };

        const worker = workerWrapper.create(getWawesApi, WavesApp.network, {
            libs: [
                '/node_modules/waves-api/dist/waves-api.min.js'
            ]
        });

        return {
            process: function (...args) {
                return utils.when(worker.process.call(worker, ...args));
            },
            terminate: function () {
                worker.terminate();
            }
        };
    };

    factory.$inject = ['utils'];

    angular.module('app.utils').factory('apiWorker', factory);
})();
