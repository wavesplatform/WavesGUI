(function () {
    'use strict';

    const factory = function (node, matcher, utils) {

        class Waves {

            constructor() {
                /**
                 * @type {Node}
                 */
                this.node = node;
                /**
                 * @type {Matcher}
                 */
                this.matcher = matcher;
                /**
                 * @type {WavesUtils}
                 */
                this.utils = utils;
            }

        }

        return new Waves();
    };

    factory.$inject = ['node', 'matcher', 'wavesUtils'];

    angular.module('app').factory('waves', factory);
})();
