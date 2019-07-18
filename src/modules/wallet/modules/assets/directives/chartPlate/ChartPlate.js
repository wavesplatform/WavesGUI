(function () {
    'use strict';

    /**
     * @param Base
     * @param {JQuery} $element
     * @return {ChartPlate}
     */
    const controller = function (Base, $element) {

        const SELECTORS = {
            plate: '.chart-plate',
            marker: '.chart-plate__marker'
        };

        class ChartPlate extends Base {

            /**
             * @public
             * @type {object}
             */
            data;

            $postLink() {
                this.plate = $element.find(SELECTORS.plate);
                this.marker = $element.find(SELECTORS.marker);
                this.observe('data', this._onMove);
            }

            /**
             * @private
             */
            _onMove() {
                const data = this.data;

                if (!data || data.leave) {
                    this.plate.removeClass('visible');
                    this.marker.removeClass('visible');
                    return null;
                }

                this._setMarkerAndPlatePosition(this.data);
            }

            /**
             * @param data @type {Object}
             * @param data.event @type {Object}
             * @param data.x @type {number}
             * @param data.y @type {number}
             * @private
             */
            _setMarkerAndPlatePosition({ event, x, y }) {
                const PLATE_ARROW_WIDTH = 5;
                const markerX = x - (this.marker.outerWidth() / 2);
                const markerY = y - (this.marker.outerHeight() / 2);
                let plateX;
                if (event.offsetX < ($element.closest('w-chart').innerWidth() / 2)) {
                    plateX = x + (this.marker.outerWidth() / 2) + PLATE_ARROW_WIDTH;
                    this.plate.addClass('to-right');
                } else {
                    plateX = markerX - this.plate.outerWidth() - PLATE_ARROW_WIDTH;
                    this.plate.removeClass('to-right');
                }
                const plateY = y - (this.plate.outerHeight() / 2);
                this.plate.css('transform', `translate(${plateX}px,${plateY}px)`);
                this.marker.css('transform', `translate(${markerX}px,${markerY}px)`);
                this.plate.addClass('visible');
                this.marker.addClass('visible');
                if (this.data.markerColor) {
                    this.marker.css('border-color', this.data.markerColor);
                }
            }

        }

        return new ChartPlate();
    };

    controller.$inject = ['Base', '$element'];

    angular.module('app.ui').component('wChartPlate', {
        transclude: true,
        require: {
            wChart: '^wChart'
        },
        bindings: {
            data: '<'
        },
        templateUrl: 'modules/wallet/modules/assets/directives/chartPlate/chartPlate.html',
        controller
    });
})();
