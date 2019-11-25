(function () {
    'use strict';

    /**
     * @param {Node} node
     * @param {app.utils} utils
     * @return {Waves}
     */
    const factory = function (node, utils) {

        class Waves {

            constructor() {
                /**
                 * @type {Node}
                 */
                this.node = node;
            }

        }

        return utils.bind(new Waves());
    };

    factory.$inject = ['node', 'utils'];

    angular.module('app').factory('waves', factory);
})();
