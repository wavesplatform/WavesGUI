(function () {
    'use strict';

    const factory = function (utils) {

        class API {

            constructor(WavesApp) {
                this.waves = WavesAPI.create({
                    networkByte: WavesApp.network.code.charCodeAt(0),
                    nodeAddress: WavesApp.network.server,
                    matcherAddress: WavesApp.network.matcher
                });
                this.seed = this.waves.Seed.create();
            }

            resetSeed() {
                this.seed = this.waves.Seed.create();
            }

            getSeed() {
                return this.seed.phrase;
            }

            getAddress() {
                return this.seed.address;
            }

        }

        const worker = workerWrapper.create(API, { network: WavesApp.network }, {
            libs: ['/node_modules/waves-api/dist/waves-api.min.js']
        });

        return {
            process: function (cb) {
                return utils.when(worker.process(cb));
            },
            terminate: function () {
                worker.terminate();
            }
        };
    };

    factory.$inject = ['utils'];

    angular.module('app.utils').factory('apiWorker', factory);
})();
