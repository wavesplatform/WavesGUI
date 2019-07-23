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
                this.signals = Object.assign(Object.create(null), this.chart.signals, this.signals);
                this.observe('data', this._updateData);
                this.observe('options', this._updateOptions);

                this.receive(this.chart.signals.mouseMove, this._onMove, this);
                this.receive(this.chart.signals.mouseLeave, this._onLeave, this);
            }

            _updateData() {
                this.chart.setData(this.data);
            }

            _updateOptions() {
                this.chart.setOptions(this.options);
            }

            _onMove(chartData) {
                this.mouseMove({ chartData });
            }

            _onLeave(event) {
                this.mouseLeave({ event });
            }

        }

        return new Chart();
    };

    controller.$inject = ['Base', 'ChartFactory', '$element'];

    angular.module('app.ui').component('wChart', {
        bindings: {
            options: '<',
            data: '<',
            mouseMove: '&',
            mouseLeave: '&'
        },
        transclude: true,
        template: '<div ng-transclude></div>',
        controller
    });
})();
