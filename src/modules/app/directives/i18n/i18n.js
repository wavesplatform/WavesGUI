(function () {
    'use strict';

    /**
     * @param Base
     * @param i18n
     * @param {app.utils} utils
     */
    const directive = function (Base, i18n, utils) {
        return {
            scope: false,
            restrict: 'AE',
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
                        return String(I18n._isAttribute() ? $element.attr('w-i18n') : $element.text()).trim();
                    }

                    /**
                     * @return {boolean}
                     * @private
                     */
                    static _isAttribute() {
                        return !!$attrs.wI18n;
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
