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
             * @param {boolean} [skipErrors]
             */
            translate(literal, ns, params, skipErrors) {
                if (!ns) {
                    ns = 'app';
                }
                const translate = [`${ns}:${literal}`];
                if (ns && ns !== 'app') {
                    translate.push(`app:${literal}`);
                }
                if (skipErrors) {
                    const has = translate.some((key) => {
                        return i18next.extantion(key, params);
                    });
                    if (has) {
                        return i18next.t(translate, params);
                    } else {
                        return '';
                    }
                }
                return i18next.t(translate, params);
            },

            /**
             * @name app.i18n#translateField
             * @param {Base} controller
             * @param {string} literalField name field with literal
             * @param {string} translatedField name field with translate result
             * @param {string} [ns]
             * @param {object} [params]
             */
            translateField(controller, literalField, translatedField, ns, params) {
                const apply = () => {
                    if (controller[literalField] != null) {
                        controller[translatedField] = this.translate(controller[literalField], ns, params);
                    }
                };

                controller.observe(literalField, apply);
                i18next.on('languageChanged', apply);

                controller.signals.destroy.once(() => {
                    i18next.off('languageChanged');
                });

                if (!controller[translatedField]) {
                    apply();
                }
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
