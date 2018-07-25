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
                this.chart = new ChartFactory($element);
                this.observe(['options', 'data'], this._render);
            }

            _render() {
                // TODO
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
    })
})();
