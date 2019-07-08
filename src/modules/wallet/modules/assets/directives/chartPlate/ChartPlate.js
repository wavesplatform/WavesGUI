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
                const date = new Date(data.xValue.toNumber());
                this.price = data.yValue.toFormat(2);
                this.date = ChartPlate._localDate(date, true);
                this.time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                this._setMarkerAndPlatePosition(data);
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
                if (event.offsetX < (window.innerWidth / 2)) {
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
            }

            /**
             * @param date @type {Date}
             * @param hasYear @type {boolean}
             * @return {string}
             * @private
             */
            static _localDate(date, hasYear = false) {
                return hasYear ? date.toLocaleDateString() : date.toLocaleDateString().slice(0, -5);
            }


        }

        return new ChartPlate();
    };

    controller.$inject = ['Base', '$element'];

    angular.module('app.ui').component('wChartPlate', {
        bindings: {
            data: '<'
        },
        templateUrl: 'modules/wallet/modules/assets/directives/chartPlate/chartPlate.html',
        controller
    });
})();
