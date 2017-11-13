(function () {
    'use strict';

    const directive = function (Base, i18n) {
        return {
            scope: true,
            restrict: 'AE',
            link($scope, $element, $attrs) {

                class I18n extends Base {

                    constructor() {
                        super($scope);

                        const handler = this._getHandler();
                        this.forStop = [() => i18next.off('languageChanged', handler)];

                        i18next.on('languageChanged', handler);
                        if ($attrs.params) {
                            const stop = $scope.$watch($attrs.params, handler);
                            this.forStop.push(stop);
                        }

                        handler();
                    }

                    $onDestroy() {
                        super.$onDestroy();
                        this.forStop.forEach((cb) => cb());
                    }

                    /**
                     * @return {Function}
                     * @private
                     */
                    _getHandler() {
                        const literal = this._compile(I18n._getLiteral());
                        const ns = i18n.getNs($element);
                        return function () {
                            const skipErros = 'skipErrors' in $attrs;
                            const params = $attrs.params && $scope.$eval($attrs.params) || undefined;
                            $element.html(i18n.translate(literal, ns, params, skipErros));
                        };
                    }

                    /**
                     * @param literal
                     * @return {*}
                     * @private
                     */
                    _compile(literal) {
                        const parts = literal.match(/{{.*?(}})/g);
                        if (!parts) {
                            return literal;
                        } else {
                            parts.forEach((part) => {
                                if (part.indexOf('::') !== -1) {
                                    console.warn(`No watched field "${part}"`); // TODO add watch?
                                }
                                const forEval = part.replace('{{', '')
                                    .replace('}}', '')
                                    .replace('::', '');
                                literal = literal.replace(part, $scope.$eval(forEval));
                            });
                        }
                        return literal;
                    }

                    /**
                     * @return {*}
                     * @private
                     */
                    static _getLiteral() {
                        return String(I18n._isAttribute() ? $attrs.wI18n : $element.text()).trim();
                    }

                    /**
                     * @return {boolean}
                     * @private
                     */
                    static _isAttribute() {
                        return !!$attrs.wI18n;
                    }

                }

                return new I18n();
            },
            transclude: true,
            template: function ($element) {
                if ($element.get(0).tagName === 'W-I18N') {
                    return '<span ng-transclude></span>';
                }
            }
        };
    };

    directive.$inject = ['Base', 'i18n'];

    angular.module('app')
        .directive('wI18n', directive);
})();
