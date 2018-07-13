(function () {
    'use strict';

    /**
     * @param Base
     * @param {VisibleService} visibleService
     * @returns {{restrict: string, transclude: boolean, link: link}}
     */
    const directive = function (Base, visibleService, $rootScope) {

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
                        const offset = this.$node.offset();
                        this.visible = offset.top > 0 && offset.top < innerHeight;
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
                            this.content.$element.remove();
                            this.content.$scope.$destroy();
                            this.content = null;
                        }
                    }

                }

                new Visible();
            }
        };
    };

    directive.$inject = ['Base', 'visibleService', '$rootScope'];

    angular.module('app.ui').directive('wVisible', directive);
})();
