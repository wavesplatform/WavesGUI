(function () {
    'use strict';

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

    /**
     * @param Base
     * @param i18n
     * @param {app.utils} utils
     */
    const directive = function (Base, i18n, utils) {
        return {
            scope: false,
            restrict: 'A',
            link($scope, $element, $attrs) {

                class I18n extends Base {

                    constructor() {
                        super($scope);

                        /**
                         * @type {Array}
                         * @private
                         */
                        this._forStop = [];
                        /**
                         * @type {Object.<boolean>}
                         * @private
                         */
                        this._watchers = Object.create(null);
                        /**
                         * @type {string}
                         * @private
                         */
                        this._literalTemplate = I18n._getLiteralTemplate();
                        /**
                         * @type {{part: string, evalTpl: string, needWatch: boolean}[]}
                         * @private
                         */
                        this._parts = I18n._getParts(this._literalTemplate);
                        /**
                         * @type {Function}
                         * @private
                         */
                        this._handler = utils.debounce(this._getHandler());

                        this._addWatchers();

                        this.listenEventEmitter(i18next, 'languageChanged', this._handler);
                        if ($attrs.params) {
                            if (!$attrs.params.includes('::')) {
                                const stop = $scope.$watch($attrs.params, this._handler);
                                this._forStop.push(stop);
                            }
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
                        const ns = this._getNs();
                        return () => {
                            const skipErrors = 'skipErrors' in $attrs;
                            const defaultValue = escape($attrs.defaultValue || '');
                            const params = $attrs.params && $scope.$eval($attrs.params) || undefined;
                            const result = i18n.translate(this._compile(this._literalTemplate), ns, params, skipErrors);
                            $element.html(result ? result : defaultValue || result);
                        };
                    }

                    _getNs() {
                        return $attrs.wI18nNs ? $attrs.wI18nNs : i18n.getNs($element);
                    }

                    /**
                     * @param {string} literal
                     * @return {string}
                     * @private
                     */
                    _compile(literal) {
                        if (this._parts) {
                            this._parts.forEach(({ part, evalTpl }) => {
                                literal = literal.replace(part, $scope.$eval(evalTpl));
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

                        this._parts.forEach(({ part, needWatch, evalTpl }) => {
                            if (needWatch && !this._watchers[part]) {
                                this._forStop.push($scope.$watch(evalTpl, this._handler));
                                this._watchers[part] = true;
                            }
                        });
                    }

                    /**
                     * @return {string}
                     * @private
                     */
                    static _getLiteralTemplate() {
                        return String($element.attr('w-i18n')).trim();
                    }

                    /**
                     * @param template
                     * @return {{part: string, evalTpl: string, needWatch: boolean}[]}
                     * @private
                     */
                    static _getParts(template) {
                        const parts = template.match(/{{.*?(}})/g);
                        if (parts) {
                            return parts.map((part) => {
                                return {
                                    part,
                                    evalTpl: part.replace('{{', '').replace('}}', '').replace('::', ''),
                                    needWatch: part.indexOf('::') === -1
                                };
                            });
                        } else {
                            return null;
                        }
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

    directive.$inject = ['Base', 'i18n', 'utils'];

    angular.module('app')
        .directive('wI18n', directive);
})();
