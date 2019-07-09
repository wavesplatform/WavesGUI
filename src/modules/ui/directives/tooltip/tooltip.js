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

                if ($scope.tipOffset === undefined) {
                    $scope.tipOffset = 20;
                }

                this.receive(utils.observe($scope, 'isShow'), this._onChangeShow, this);
                this._onChangeShow();
            }

            /**
             * @private
             */
            _render() {
                $templateRequest(TEMPLATE_URL).then(template => {
                    const compiled = $compile(template)($scope);
                    $document.find('body').append(compiled);
                    this.$tooltip = $(compiled[1]);

                    this.listenEventEmitter($element, 'mouseover', () => this._onHover());
                    this.listenEventEmitter($element, 'mouseleave', () => this.$tooltip.removeClass('show'));
                });
            }

            /**
             * @private
             */
            _onHover() {
                this.$tooltip.addClass('show');
                this.$tooltip.css(this._getPosition());
            }

            /**
             * @private
             */
            _onChangeShow() {
                if ($scope.isShow) {
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
            _getPosition() {
                const tooltipArrowSize = window.getComputedStyle(this.$tooltip[0], ':before').height.slice(0, -2) / 2;

                const {
                    width: elementWidth,
                    height: elementHeight,
                    left: elemLeft,
                    top: elemTop
                } = $element[0].getBoundingClientRect();

                const { width: tooltipWidth, height: tooltipHeight } = this.$tooltip[0].getBoundingClientRect();

                const centerLeft = elemLeft + (elementWidth / 2) - (tooltipWidth / 2);
                const centerTop = elemTop + (elementHeight / 2) - (tooltipHeight / 2);

                switch ($scope.direction) {
                    case 'top':
                        return {
                            left: centerLeft,
                            top: elemTop - tooltipHeight - $scope.tipOffset - tooltipArrowSize
                        };
                    case 'bottom':
                        return {
                            left: centerLeft,
                            top: elemTop + elementHeight + $scope.tipOffset + tooltipArrowSize
                        };
                    case 'left':
                        return {
                            left: elemLeft - tooltipWidth - $scope.tipOffset - tooltipArrowSize,
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
                            top: elemTop - tooltipHeight - $scope.tipOffset
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
                    tipLocale: '<',
                    tipNameSpace: '<',
                    tipOffset: '<',
                    isShow: '<'
                },
                controller
            };
        });
})();
