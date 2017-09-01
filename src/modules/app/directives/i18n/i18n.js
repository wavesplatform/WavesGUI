(function () {
    'use strict';

    const controller = function ($element, $attrs) {
        return {
            $postLink() {
                const isAttribute = !!$attrs.wI18n;
                const ns = $attrs.wI18nNs || $element.closest('[w-i18n-ns]').attr('w-i18n-ns') || '';

                let literal;

                if (isAttribute) {
                    literal = $attrs.wI18n;
                } else {
                    literal = $element.text();
                }

                const content = [ns, literal].filter(Boolean).join(':');
                $element.html(i18next.t(content));
            }
        };
    };

    controller.$inject = ['$element', '$attrs'];

    angular.module('app').directive('wI18n', () => {
        return {
            restrict: 'AE',
            controller: controller,
            transclude: true,
            template: function ($element) {
                if ($element.get(0).tagName === 'W-I18N') {
                    return '<span ng-transclude></span>';
                }
            }
        };
    });
})();
