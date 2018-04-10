/* global BigNumber */
(function () {
    'use strict';

    const DEFAULT_OPTIONS = {
        direction: false,
        startFrom: 0,
        center: 0
    };

    /**
     *
     * @param Base
     * @param $element
     * @return {CircleChart}
     */
    const controller = function (Base, $element) {

        class CircleChart extends Base {

            constructor() {
                super();
                /**
                 * @type {HTMLCanvasElement}
                 * @private
                 */
                this._canvas = null;
                /**
                 * @type {CanvasRenderingContext2D}
                 * @private
                 */
                this._ctx = null;
                this._options = null;
                this._data = null;

                this.observe(['_options', '_data'], this._redrawGraph);
            }

            $postLink() {
                this._canvas = $element.find('canvas').get(0);
                this._ctx = this._canvas.getContext('2d');
                this._redrawGraph();
            }

            _resetCanvasSize() {
                const reducer = (result, item) => Math.max(result, this._options.items[item.id].radius);
                const size = this._data.reduce(reducer, 0) * 2 + 2;

                this._canvas.width = size;
                this._canvas.height = size;
            }

            _getBalances() {
                return this._data
                    .map((item) => {
                        const value = item.value instanceof Waves.Money ? item.value.getTokens() : item.value;
                        return { id: item.id, value };
                    });
            }

            _redrawGraph() {
                if (!this._canvas) {
                    return null;
                }

                if (!this._data || !this._data.length) {
                    return null;
                }

                if (!this._options || !this._options.items) {
                    return null;
                }

                this._resetCanvasSize();
                this._draw();
            }

            _draw() {
                const balances = this._getBalances();
                const total = balances.reduce((result, item) => result.add(item.value), new BigNumber(0));
                const center = this._canvas.height / 2 + 0.5;
                const insightRadius = this._options.center || DEFAULT_OPTIONS.center;

                const empty = total.eq(0);
                $element.toggleClass('empty-chart', empty);
                if (empty) {
                    return false;
                }

                let startFrom = this._options.startFrom;

                balances.forEach((item) => {
                    /**
                     * @type {{color: string, radius: number}}
                     */
                    const options = this._options.items[item.id];
                    const progress = item.value.div(total);
                    const end = startFrom + (2 * Math.PI) * progress;

                    const startInsight = {
                        x: center + insightRadius * Math.cos(startFrom),
                        y: center + insightRadius * Math.cos(Math.PI / 2 - startFrom)
                    };

                    const startOut = {
                        x: center + options.radius * Math.cos(startFrom),
                        y: center + options.radius * Math.cos(Math.PI / 2 - startFrom)
                    };

                    const endInsight = {
                        x: center + insightRadius * Math.cos(end),
                        y: center + insightRadius * Math.cos(Math.PI / 2 - end)
                    };

                    this._ctx.beginPath();
                    this._ctx.fillStyle = options.color;
                    this._ctx.strokeStyle = options.color;
                    this._ctx.lineWidth = 1;

                    this._ctx.moveTo(startInsight.x, startInsight.y);
                    this._ctx.lineTo(startOut.x, startOut.y);
                    this._ctx.arc(center, center, options.radius, startFrom, end);
                    this._ctx.lineTo(endInsight.x, endInsight.y);
                    this._ctx.moveTo(startInsight.x, startInsight.y);
                    this._ctx.arc(center, center, insightRadius, startFrom, end);
                    this._ctx.fill();
                    this._ctx.closePath();

                    startFrom = end;
                });

                if (insightRadius) {
                    this._ctx.beginPath();
                    this._ctx.fillStyle = '#fff';
                    this._ctx.arc(center, center, insightRadius, 0, 2 * Math.PI);
                    this._ctx.fill();
                    this._ctx.closePath();
                }
            }

        }

        return new CircleChart();
    };

    controller.$inject = ['Base', '$element', 'utils'];

    angular.module('app.ui').component('wCircleChart', {
        bindings: {
            _options: '<options',
            _data: '<data'
        },
        template: '<canvas></canvas>',
        transclude: false,
        controller
    });
})();
