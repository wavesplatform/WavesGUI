(function () {
    'use strict';

    /**
     * @param Base
     * @param {VisibleService} visibleService
     * @param {TimeLine} timeLine
     * @returns {{restrict: string, transclude: boolean, link: link}}
     */
    const directive = function (Base, visibleService) {

        return {
            restrict: 'E',
            transclude: true,
            scope: false,
            link: function ($scope, $element, $attrs, $ctrl, $transclude) {

                const once = $attrs.once === '' || $attrs.once === 'true';
                const root = $attrs.scrollRootSelector;

                class Visible extends Base {

                    constructor() {
                        super($scope);
                        /**
                         * @type {JQuery}
                         */
                        this.$node = $element;
                        /**
                         * @type {{$element: JQuery, $scope: $rootScope.Scope}}
                         */
                        this.content = null;
                        /**
                         * @type {HTMLElement}
                         */
                        this.node = $element.get(0);
                        /**
                         * @type {boolean}
                         */
                        this.visible = false;
                        /**
                         * @type {Promise}
                         * @private
                         */
                        this._appendPromise = null;

                        const $scrollRootElement = root ? $element.closest(root) : $element.parent();

                        visibleService.registerVisibleComponent(this, $scrollRootElement);
                        this.observe('visible', this._onChangeVisible);

                        this.signals.destroy.once(() => {
                            if (this.content) {
                                this.content.$scope.$destroy();
                                this.content.$element.remove();
                                this.content = null;
                            }
                        });
                    }

                    currentVisibleState() {
                        const rect = this.node.getBoundingClientRect();
                        const visible = rect.top > 0 && rect.top < innerHeight;
                        this.visible = visible;

                        return visible;
                    }

                    /**
                     * @private
                     */
                    _onChangeVisible() {
                        if (this._appendPromise) {
                            this._appendPromise.then(() => this._onChangeVisible());
                            return null;
                        }

                        if (this.visible) {
                            this._appendPromise = this._append().then(() => {
                                this._appendPromise = null;
                            });
                            if (once) {
                                visibleService.unregisterVisibleComponent(this);
                            }
                        } else {
                            this.content.$element.remove();
                            this.content.$scope.$destroy();
                        }
                    }

                    /**
                     * @return {Promise<any>}
                     * @private
                     */
                    _append() {
                        return new Promise((resolve) => {
                            $transclude(($element, $scope) => {
                                this.$node.append($element);
                                this.content = { $element, $scope };
                                resolve();
                            });
                        });
                    }

                }

                new Visible();
            }
        };
    };

    directive.$inject = ['Base', 'visibleService'];

    angular.module('app.ui').directive('wVisible', directive);
})();
