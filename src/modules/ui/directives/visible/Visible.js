(function () {
    'use strict';

    /**
     * @param Base
     * @param {VisibleService} visibleService
     * @param {TimeLine} timeLine
     * @returns {{restrict: string, transclude: boolean, link: link}}
     */
    const directive = function (Base, visibleService, timeLine) {

        return {
            restrict: 'E',
            transclude: true,
            scope: false,
            link: function ($scope, $element, $attrs, $ctrl, $transclude) {

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

                        visibleService.registerVisibleComponent(this);
                        this.observe('visible', this._onChangeVisible);

                        this.signals.destroy.once(() => {
                            if (this.content) {
                                this.content.$scope.$destroy();
                                this.content.$element.remove();
                                this.content = null;
                            }
                        });

                        this.currentVisibleState();
                    }

                    currentVisibleState() {
                        const rect = this.node.getBoundingClientRect();
                        const visible = rect.top > 0 || rect.top < innerHeight;
                        this.visible = visible;

                        return visible;
                    }

                    /**
                     * @private
                     */
                    _onChangeVisible() {
                        if (this.visible) {
                            $transclude(($element, $scope) => {
                                this.$node.append($element);
                                this.content = { $element, $scope };
                            });
                        } else {
                            const content = this.content;
                            this.content = null;

                            timeLine.wait(0).then(() => {
                                content.$element.remove();
                                content.$scope.$destroy();
                            });
                        }
                    }

                }

                new Visible();
            }
        };
    };

    directive.$inject = ['Base', 'visibleService', 'timeLine'];

    angular.module('app.ui').directive('wVisible', directive);
})();
