(function () {
    'use strict';

    /**
     * @name app.utils.apiWorker
     */

    /**
     * @param {app.utils} utils
     * @return {{process: process, terminate: terminate}}
     */
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
            /**
             * @name app.utils.apiWorker#process
             * @param {Function} code
             * @param {*} [data]
             * @return {*|Promise}
             */
            process: function (code, data) {
                return utils.when(worker.process(code, data));
            }
        };
    };

    factory.$inject = ['utils'];

    angular.module('app.utils')
        .factory('apiWorker', factory);
})();
