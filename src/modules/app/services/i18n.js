(function () {
    'use strict';

    const factory = function () {

        return {
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

            getNs($element) {
                return $element.attr('w-i18n-ns') || $element.closest('[w-i18n-ns]').attr('w-i18n-ns') || '';
            }
        };
    };

    angular.module('app').factory('i18n', factory);
})();
