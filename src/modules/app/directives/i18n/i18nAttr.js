(function () {
    'use strict';

    /**
     * @param {JQuery} $element
     * @param {object} $attrs
     * @param {app.i18n} i18n
     * @param {$rootScope.Scope} $scope
     * @param {Base} Base
     * @param {app.utils} utils
     * @return {{listener: null, $postLink: (function()), $onDestroy: (function())}}
     */
    const controller = function ($element, $attrs, i18n, $scope, Base, utils) {

        class I18nAttr extends Base {

            constructor() {
                super($scope);

                /**
                 * @type {Array}
                 * @private
                 */
                this._forStop = [];
                /**
                 * @type {any}
                 * @private
                 */
                this._watchers = Object.create(null);
                /**
                 * Array of attr name for translate
                 * @type {Array<string>}
                 * @private
                 */
                this._toTranslate = $attrs.wI18nAttr.split(',');
                /**
                 * @type {Object.<string, Array>}
                 * @private
                 */
                this._literalTemplatesHash = this._toTranslate.reduce((acc, attrName) => {
                    acc[attrName] = $element.attr(attrName).trim();
                    return acc;
                }, Object.create(null));
                /**
                 * @type {Object}
                 * @private
                 */
                this._partsHash = this._toTranslate.reduce((acc, attrName) => {
                    acc[attrName] = I18nAttr._getParts($attrs[attrName]);
                    return acc;
                }, Object.create(null));
                /**
                 * @type {Function}
                 * @private
                 */
                this._handler = utils.debounce(this._getHandler());

                this.listenEventEmitter(i18next, 'languageChanged', this._handler);
                this._addWatchers();
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
                    this._toTranslate.forEach((attrName) => {
                        const params = $attrs.params && $scope.$eval($attrs.attrParams) || undefined;
                        const value = i18n.translate(this._compile(attrName), ns, params, false);
                        $element.attr(attrName, value);
                    });
                };
            }

            /**
             * @param {string} literal
             * @return {string}
             * @private
             */
            _compile(attrName) {
                const template = this._literalTemplatesHash[attrName];
                const parts = this._partsHash[attrName];
                let literal = template;

                if (parts) {
                    parts.forEach(({ part, evalTpl }) => {
                        literal = literal.replace(part, $scope.$eval(evalTpl));
                    });
                }
                return literal;
            }

            /**
             * @return {string}
             * @private
             */
            _getNs() {
                return $attrs.wI18nNs ? $attrs.wI18nNs : i18n.getNs($element);
            }

            /**
             * @private
             */
            _addWatchers() {
                Object.values(this._partsHash).forEach((parts) => {
                    (parts || []).forEach(({ part, needWatch, evalTpl }) => {
                        if (needWatch && !this._watchers[part]) {
                            this._forStop.push($scope.$watch(evalTpl, this._handler));
                            this._watchers[part] = true;
                        }
                    });
                });
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


        return new I18nAttr();
    };

    controller.$inject = ['$element', '$attrs', 'i18n', '$scope', 'Base', 'utils'];

    angular.module('app')
        .directive('wI18nAttr', () => {
            return {
                scope: false,
                restrict: 'A',
                controller: controller
            };
        });
})();
