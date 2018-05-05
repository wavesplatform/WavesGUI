(function () {
    'use strict';

    /**
     * @param $q
     * @param {Function} localeParser
     */
    const factory = function ($q, localeParser) {

        const onLoad = $q((resolve) => {
            i18next.on('initialized', resolve);
        });

        const escape = function (text) {
            return text.split('').map((char) => {
                switch (char.charCodeAt(0)) {
                    case 34: // "
                        return '&quot;';
                    case 38: // &
                        return '&amp;';
                    case 39: // '
                        return '&#39;';
                    case 60: // <
                        return '&lt;';
                    case 62: // >
                        return '&gt;';
                    default:
                        return char;
                }
            }).join('');
        };

        const parse = function (text) {
            return localeParser(escape(text));
        };

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
                        return parse(i18next.t(translate, params));
                    } else {
                        return '';
                    }
                }
                return parse(i18next.t(translate, { ...params, interpolation: { escapeValue: false } }));
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

    factory.$inject = ['$q', 'localeParser'];

    angular.module('app')
        .factory('i18n', factory);
})();
