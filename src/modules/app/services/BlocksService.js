(function () {
    'use strict';

    /**
     * @param {app.utils.apiWorker} apiWorker
     * @param {app.utils.decorators} decorators
     */
    const factory = function (apiWorker, decorators) {

        return {

            /**
             *
             * @return {number|Promise}
             */
            @decorators.cachable(2)
            getHeight() {
                return apiWorker.process((Waves) => {
                    return Waves.API.Node.v1.blocks.height().then((res) => res.height);
                });
            }

        };
    };

    factory.$inject = ['apiWorker', 'decorators'];

    angular.module('app').factory('blocksService', factory);
})();
