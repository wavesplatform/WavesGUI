(function () {
    'use strict';

    /**
     * @param Base
     * @param {JQuery} $element
     * @return {ChartPlate}
     */
    const controller = function (Base, $element, user) {

        const SELECTORS = {
            plate: '.chart-plate',
            platePrice: '.chart-plate__price',
            plateDate: '.chart-plate__date',
            plateTime: '.chart-plate__time',
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

            _onMove() {
                const data = this.data;

                if (!data || !data.yValue) {
                    this.plate.removeClass('visible');
                    this.marker.addClass('visible');
                    return null;
                }
                this.price = data.yValue.toFormat(2);
                this.date = ChartPlate._localDate(data.xValue, true);
                this.time = data.xValue.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                this._setMarkerAndPlatePosition(data);
            }

            /**
             * @param event
             * @param x
             * @param y
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
             * @param date
             * @param hasYear
             * @return {string}
             * @private
             */
            static _localDate(date, hasYear = false) {
                const userLang = user.getSetting('lng');
                const remapLangs = lang => {
                    switch (lang) {
                        case 'nl_NL':
                            return 'nl';
                        case 'pt_BR':
                            return 'pt';
                        case 'et_EE':
                            return 'est';
                        case 'hi_IN':
                            return 'hi';
                        case 'zh_CN':
                            return 'cn';
                        default:
                            return lang;
                    }
                };
                return date.toLocaleDateString(remapLangs(userLang), {
                    day: 'numeric',
                    month: 'numeric',
                    year: hasYear ? 'numeric' : undefined
                });
            }


        }

        return new ChartPlate();
    };

    controller.$inject = ['Base', '$element', 'user'];

    angular.module('app.ui').component('wChartPlate', {
        bindings: {
            data: '<'
        },
        templateUrl: 'modules/wallet/modules/assets/directives/chartPlate/chartPlate.html',
        controller
    });
})();
