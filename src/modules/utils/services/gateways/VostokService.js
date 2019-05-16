(function () {
    'use strict';

    const GATEWAYS = {
        [WavesApp.defaultAssets.VOSTOK]: { waves: 'WVOSTOK', gateway: 'VOSTOK' }
    };

    // const PATH = 'http://99.81.221.211:32073/api/v1';

    /**
     * @returns {VostokService}
     */

    const factory = function () {

        class VostokService {

            /**
             * @param {Asset} asset
             * @return {IGatewaySupportMap}
             */
            getSupportMap(asset) {
                if (GATEWAYS[asset.id]) {
                    return {
                        deposit: true,
                        withdraw: true
                    };
                }
            }

        }

        return new VostokService();
    };

    angular.module('app.utils').factory('vostokService', factory);
})();
