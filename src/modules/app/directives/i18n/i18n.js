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

                        this._forStop = [];
                        this._watchers = Object.create(null);
                        this._literalTemplate = I18n._getLiteralTemplate();
                        this._parts = this._literalTemplate.match(/{{.*?(}})/g);
                        this._handler = this._getHandler();

                        this._addWatchers();

                        this.listenEventEmitter(i18next, 'languageChanged', this._handler);
                        if ($attrs.params) {
                            const stop = $scope.$watch($attrs.params, this._handler);
                            this._forStop.push(stop);
                        }

                        this._handler();
                    }

                    $onDestroy() {
                        super.$onDestroy();
                        this._forStop.forEach((cb) => cb());
                        this._forStop = [];
                    }

                    /**
                     * @return {Function}
                     * @private
                     */
                    _getHandler() {
                        const ns = i18n.getNs($element);
                        return () => {
                            const skipErrors = 'skipErrors' in $attrs;
                            const params = $attrs.params && $scope.$eval($attrs.params) || undefined;
                            $element.html(i18n.translate(this._compile(this._literalTemplate), ns, params, skipErrors));
                        };
                    }

                    /**
                     * @param {string} literal
                     * @return {string}
                     * @private
                     */
                    _compile(literal) {
                        if (this._parts) {
                            this._parts.forEach((part) => {
                                const forEval = part
                                    .replace('{{', '')
                                    .replace('}}', '')
                                    .replace('::', '');

                                literal = literal.replace(part, $scope.$eval(forEval));
                            });
                        }
                        return literal;
                    }

                    /**
                     * @private
                     */
                    _addWatchers() {
                        if (!this._parts) {
                            return null;
                        }

                        this._parts.forEach((part) => {
                            const needWatcher = part.indexOf('::') === -1;

                            if (needWatcher && !this._watchers[part]) {
                                const forEval = part
                                    .replace('{{', '')
                                    .replace('}}', '')
                                    .replace('::', '');

                                this._forStop.push($scope.$watch(forEval, this._handler));
                                this._watchers[part] = true;
                            }
                        });
                    }

                    /**
                     * @return {*}
                     * @private
                     */
                    static _getLiteralTemplate() {
                        return String(I18n._isAttribute() ? $element.attr('w-i18n') : $element.text()).trim();
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
