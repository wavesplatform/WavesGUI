(function () {
    'use strict';

    /**
     *
     * @param Base
     * @param $scope
     * @param $element
     * @param $document
     * @param i18n
     * @param {app.utils} utils
     * @param $templateRequest
     * @param $compile
     * @return {Tooltip}
     */
    const controller = function (Base, $scope, $element, $document, i18n, utils, $templateRequest, $compile) {

        const TEMPLATE_URL = 'modules/ui/directives/tooltip/tooltip.html';

        class Tooltip extends Base {

            constructor() {
                super($scope);

                this._hasMouseEvent = false;

                if ($scope.tipOffset === undefined) {
                    $scope.tipOffset = 0;
                }

                this.receive(utils.observe($scope, 'isShow'), this._onChangeShow, this);
                this._onChangeShow();
            }

            /**
             * @private
             */
            _render() {
                $templateRequest(TEMPLATE_URL).then(template => {
                    this.$tooltip = $compile(template)($scope);
                    this.$tooltip.find('.tooltip__content').append($compile($scope.tipContent)($scope.$parent));
                    this.listenEventEmitter($element, 'mouseenter', () => this._onHover());
                    this.listenEventEmitter($element, 'mouseleave', () => this._onLeave());
                });
                this._hasMouseEvent = true;
            }

            /**
             * @private
             */
            _onHover() {
                $document.find('body').append(this.$tooltip);
                this.$tooltip.css(Tooltip._getPosition());
                $scope.$parent.$digest();
            }

            _onLeave() {
                this.$tooltip.remove();
            }

            /**
             * @private
             */
            _onChangeShow() {
                if ($scope.isShow && !this._hasMouseEvent) {
                    this._render();
                }
            }

            /**
             * @private
             */
            $onDestroy() {
                super.$onDestroy();
                this.stopListenEventEmitter($element);
                if (this.$tooltip) {
                    this.$tooltip.remove();
                }
            }


            /**
             * @return {{top: number, left: number}} @type {Object}
             * @private
             */
            static _getPosition() {
                const tooltipArrowSize = 5;

                const {
                    width: elementWidth,
                    height: elementHeight,
                    left: elemLeft,
                    top: elemTop
                } = $element[0].getBoundingClientRect();

                const centerLeft = elemLeft + (elementWidth / 2);
                const centerTop = elemTop + (elementHeight / 2);

                switch ($scope.direction) {
                    case 'top':
                        return {
                            left: centerLeft,
                            top: elemTop - $scope.tipOffset - tooltipArrowSize
                        };
                    case 'bottom':
                        return {
                            left: centerLeft,
                            top: elemTop + elementHeight + $scope.tipOffset + tooltipArrowSize
                        };
                    case 'left':
                        return {
                            left: elemLeft - $scope.tipOffset - tooltipArrowSize,
                            top: centerTop
                        };
                    case 'right':
                        return {
                            left: elemLeft + elementWidth + $scope.tipOffset + tooltipArrowSize,
                            top: centerTop
                        };
                    default:
                        return {
                            left: centerLeft,
                            top: elemTop - $scope.tipOffset - tooltipArrowSize
                        };
                }
            }

        }

        return new Tooltip();
    };

    controller.$inject = ['Base', '$scope', '$element', '$document', 'i18n', 'utils', '$templateRequest', '$compile'];

    angular.module('app')
        .directive('wTooltip', () => {
            return {
                restrict: 'AE',
                scope: {
                    direction: '<',
                    tipContent: '<',
                    tipOffset: '<',
                    isShow: '<'
                },
                controller
            };
        });
})();
