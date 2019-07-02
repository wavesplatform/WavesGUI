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
            }

            _updateData() {
                this.chart.setData(this.data);
            }

            _updateOptions() {
                this.chart.setOptions(this.options);
            }

        }

        return new Chart();
    };

    controller.$inject = ['Base', 'ChartFactory', '$element'];

    angular.module('app.ui').component('wChart', {
        bindings: {
            options: '<',
            data: '<'
        },
        scope: false,
        controller
    });
})();
