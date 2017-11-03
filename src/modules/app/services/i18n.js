(function () {
    'use strict';

    const factory = function ($q) {

        const onLoad = $q((resolve) => {
            i18next.on('initialized', resolve);
        });

        /**
         * @name app.i18n
         */

        return {
            /**
             * @name app.i18n#translate
             * @param {string} literal
             * @param {string} [ns]
             * @param {object} [params]
             */
            translate(literal, ns, params) {
                if (!ns) {
                    ns = 'app';
                }
                const translate = [`${ns}:${literal}`];
                if (ns && ns !== 'app') {
                    translate.push(`app:${literal}`);
                }
                return i18next.t(translate, params);
            },

            /**
             * @name app.i18n#getNs
             * @param {JQuery} $element
             * @return {string}
             */
            getNs($element) {
                return $element.attr('w-i18n-ns') || $element.closest('[w-i18n-ns]')
                    .attr('w-i18n-ns') || '';
            },

            onLoad
        };
    };

    factory.$inject = ['$q'];

    angular.module('app')
        .factory('i18n', factory);
})();
