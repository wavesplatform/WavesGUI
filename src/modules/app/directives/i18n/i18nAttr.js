(function () {
    'use strict';

    const controller = function ($element, $attrs, i18n) {
        return {
            listeners: Object.create(null),
            $postLink() {
                const ns = i18n.getNs($element);

                const list = $attrs.wI18nAttr.split(' ');
                const listener = function () {
                    list.forEach((attrName) => {
                        $element.attr(attrName, i18n.translate($element.attr(attrName), ns));
                    });
                };
                listener();
                this.listeners.languageChanged = [listener];
                i18next.on('languageChanged', listener);
            },
            $onDestroy() {
                tsUtils.each((listeners, event) => {
                    listeners.forEach((listener) => {
                        i18next.off(event, listener);
                    });
                });
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
