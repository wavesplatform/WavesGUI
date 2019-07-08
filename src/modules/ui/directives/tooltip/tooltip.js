(function () {
    'use strict';

    const controller = function (Base, $scope, $element, $document) {

        const $ = require('jquery');

        class Tooltip extends Base {

            // /**
            //  * @private
            //  * @type {Object}
            //  */
            // _tooltipPosition = {
            //     left: null,
            //     top: null
            // };

            $postLink() {
                this.tooltip = this._getTooltip();
                $document.append(this.tooltip);
                this._setPosition();
            }

            _getTooltip() {
                return $(`<div class="tooltip tooltip_${this.direction}" w-i18n="${this.w18n}"></div>`);
            }

            _setPosition() {
                this.tooltip.css(this._getPosition());
            }

            /**
             * @return {{top: number, left: number}} @type {Object}
             * @private
             */
            _getPosition() {
                const { left: elemLeft, top: elemTop } = $element.offset();
                switch (this.direction) {
                    case 'top':
                        return {
                            left: elemLeft - (this.tooltip.outerWidth() / 2),
                            top: elemTop - this.tooltip.outerHeight()
                        };
                    case 'bottom':
                        return {
                            left: elemLeft - (this.tooltip.outerWidth() / 2),
                            top: elemTop - (this.tooltip.outerHeight() / 2)
                        };
                    case 'left':
                        return {
                            left: elemLeft - (this.tooltip.outerWidth() / 2),
                            top: elemTop - (this.tooltip.outerHeight() / 2)
                        };
                    case 'right':
                        return {
                            left: elemLeft - (this.tooltip.outerWidth() / 2),
                            top: elemTop - (this.tooltip.outerHeight() / 2)
                        };
                    default:
                        return {
                            left: elemLeft - (this.tooltip.outerWidth() / 2),
                            top: elemTop - (this.tooltip.outerHeight() / 2)
                        };
                }
            }

        }

        return new Tooltip();
    };

    controller.$inject = ['Base', '$scope', '$element', '$document'];

    angular.module('app')
        .directive('wTooltip', () => {
            return {
                restrict: 'A',
                scope: {
                    direction: '<',
                    w18n: '<'
                },
                controller: controller
            };
        });
})();
