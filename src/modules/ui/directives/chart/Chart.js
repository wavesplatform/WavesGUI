(function () {
    'use strict';

    /**
     * @param Base
     * @param {ChartFactory} ChartFactory
     * @param {JQuery} $element
     * @return {Chart}
     */
    const controller = function (Base, ChartFactory, $element) {

        const { Signal } = require('ts-utils');

        class Chart extends Base {

            constructor() {
                super();
                this.signals = Object.assign(this.signals, {
                    mouseMove: new Signal(),
                    mouseLeave: new Signal()
                });
            }

            $postLink() {
                this.chart = new ChartFactory($element, this.options, this.data);
                this.observe('data', this._updateData);
                this.observe('options', this._updateOptions);

                this.receive(this.chart.signals.mouseMove, this.signals.mouseMove.dispatch, this.signals.mouseMove);
                this.receive(this.chart.signals.mouseLeave, this.signals.mouseLeave.dispatch, this.signals.mouseLeave);
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
