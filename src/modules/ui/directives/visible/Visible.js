(function () {
    'use strict';

    /**
     * @param Base
     * @param {VisibleService} visibleService
     * @returns {{restrict: string, transclude: boolean, link: link}}
     */
    const directive = function (Base, visibleService) {

        return {
            restrict: 'E',
            transclude: true,
            link: function ($scope, $element, $attrs, $ctrl, $transclude) {

                class Visible extends Base {

                    constructor() {
                        super($scope);
                        /**
                         * @type {JQuery}
                         */
                        this.$node = $element;
                        /**
                         * @type {JQuery}
                         */
                        this.$content = null;
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
                        this.currentVisibleState();

                        this.signals.destroy.once(() => {
                            if (this.$content) {
                                this.$content.remove();
                                this.$content = null;
                            }
                        });
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
                            if (this.$content) {
                                this.$node.append(this.$content);
                            } else {
                                $transclude($clone => {
                                    this.$node.append($clone);
                                    this.$content = $clone;
                                });
                            }
                        } else {
                            this.$node.height(this.$content.height());
                            this.$content.detach();
                        }
                    }

                }

                new Visible();
            }
        };
    };

    directive.$inject = ['Base', 'visibleService'];

    angular.module('app.ui').directive('wVisible', directive);
})();
