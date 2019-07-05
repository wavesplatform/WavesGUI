(function () {
    'use strict';

    /**
     * @param Base
     * @param {ChartFactory} ChartFactory
     * @param {JQuery} $element
     * @return {Chart}
     */
    const controller = function (Base, ChartFactory, $element) {

        class Chart extends Base {

            $postLink() {
                this.chart = new ChartFactory($element, this.options, this.data);
                this.observe('data', this._updateData);
                this.observe('options', this._updateOptions);

                // this.

                this.receive(this.chart.mouse, this._onMove, this);
            }

            _updateData() {
                this.chart.setData(this.data);
            }

            _updateOptions() {
                this.chart.setOptions(this.options);
            }

            _onMove(chartData) {
                this.mouseEvent({ chartData });
            }

            $onDestroy() {
                super.$onDestroy();
                $element.off();
            }

        }

        return new Chart();
    };

    controller.$inject = ['Base', 'ChartFactory', '$element'];

    angular.module('app.ui').component('wChart', {
        bindings: {
            options: '<',
            data: '<',
            mouseEvent: '&'
        },
        transclude: true,
        template: '<div ng-transclude></div>',
        controller
    });
})();
