(function () {
    'use strict';

    const controller = function ($element, $attrs, i18n) {
        return {
            listener: null,
            $postLink() {
                const ns = i18n.getNs($element);

                const list = $attrs.wI18nAttr.split(' ');
                const listener = function () {
                    list.forEach((attrName) => {
                        $element.attr(attrName, i18n.translate($element.attr(attrName), ns));
                    });
                };
                listener();
                this.listener = listener;
                i18next.on('languageChanged', listener);
            },
            $onDestroy() {
                i18next.off('languageChanged', this.listener);
            }
        };
    };

    controller.$inject = ['$element', '$attrs', 'i18n'];

    angular.module('app').directive('wI18nAttr', () => {
        return {
            restrict: 'A',
            controller: controller
        };
    });
})();
