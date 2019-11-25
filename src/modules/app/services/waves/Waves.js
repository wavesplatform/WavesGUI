(function () {
    'use strict';

    /**
     * @param {Node} node
     * @param {WavesUtils} wavesUtils
     * @param {app.utils} utils
     * @return {Waves}
     */
    const factory = function (node, wavesUtils, utils) {

        class Waves {

            constructor() {
                /**
                 * @type {Node}
                 */
                this.node = node;
                /**
                 * @type {WavesUtils}
                 */
                this.utils = wavesUtils;
            }

        }

        return utils.bind(new Waves());
    };

    factory.$inject = ['node', 'wavesUtils', 'utils'];

    angular.module('app').factory('waves', factory);
})();
