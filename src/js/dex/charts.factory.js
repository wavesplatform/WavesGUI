(function () {
    'use strict';

    angular
        .module('app.dex')
        .factory('chartsFactory', [function () {
            function CandlestickChart($element) {
                var w = $element.width(),
                    h = $element.height(),
                    elem = $element.children('.chart').get(0),
                    margins = {left: 60, top: 20, right: 60, bottom: 30};

                this.width = w - margins.left - margins.right;
                this.height = h - margins.top - margins.bottom;

                this.x = techan.scale.financetime().range([0, this.width]);
                this.y = d3.scaleLinear().range([this.height, 0]);
                this.yVolume = d3.scaleLinear().range([this.y(0), this.y(0.2)]);

                this.candlestick = techan.plot.candlestick().xScale(this.x).yScale(this.y);
                this.accessor = this.candlestick.accessor();
                this.volume = techan.plot.volume()
                    .accessor(this.accessor)
                    .xScale(this.x)
                    .yScale(this.yVolume);

                this.xAxis = d3.axisBottom(this.x);
                this.yAxis = d3.axisLeft(this.y);
                this.yAxisRight = d3.axisRight(this.y);
                this.volumeAxis = d3.axisRight(this.yVolume).ticks(2).tickFormat(d3.format(',.3s'));

                this.svg = d3
                    .select(elem)
                    .append('svg')
                    .attr('width', this.width + margins.left + margins.right)
                    .attr('height', this.height + margins.top + margins.bottom);

                this.chart = this.svg
                    .append('g')
                    .attr('transform', 'translate(' + margins.left + ',' + margins.top + ')');

                this.chart.append('g')
                    .attr('class', 'candlestick');

                this.chart.append('g')
                    .attr('class', 'volume');

                this.chart.append('g')
                    .attr('class', 'x axis')
                    .attr('transform', 'translate(0,' + this.height + ')');

                this.chart.append('g')
                    .attr('class', 'y axis');

                this.chart.append('g')
                    .attr('class', 'y axis-right')
                    .attr('transform', 'translate(' + this.width + ',0)');

                this.chart.append('g')
                    .attr('class', 'volume axis');

                this.chart.append('text')
                    .attr('class', 'note')
                    .attr('transform', 'translate(' + (this.width - 250) + ',10)')
                    .text('Candles cover 30 minute intervals');

                this.chart.append('text')
                    .attr('class', 'ticker')
                    .attr('transform', 'translate(' + (this.width - 250) + ',30)');
            }

            CandlestickChart.prototype.clear = function () {
                this.draw([]);
            };

            CandlestickChart.prototype.draw = function (data) {
                data = this.prepareData(data);

                this.x.domain(data.map(this.accessor.d));
                this.y.domain(techan.scale.plot.ohlc(data, this.accessor).domain());
                this.yVolume.domain(techan.scale.plot.volume(data).domain());

                this.chart.selectAll('g.candlestick').datum(data).call(this.candlestick);
                this.chart.selectAll('g.volume').datum(data).call(this.volume);
                this.chart.selectAll('g.x.axis').call(this.xAxis);
                this.chart.selectAll('g.y.axis').call(this.yAxis);
                this.chart.selectAll('g.y.axis-right').call(this.yAxisRight);
                this.chart.selectAll('g.volume.axis').call(this.volumeAxis);

                var now = new Date(),
                    hh = now.getHours(),
                    mm = now.getMinutes(),
                    ss = now.getSeconds();
                hh = hh < 10 ? '0' + hh : hh;
                mm = mm < 10 ? '0' + mm : mm;
                ss = ss < 10 ? '0' + ss : ss;
                this.chart.selectAll('text.ticker').text('Last updated: ' + hh + ':' + mm + ':' + ss);
            };

            CandlestickChart.prototype.prepareData = function (rawData) {
                var self = this,
                    lastTradePrice = 0;
                return rawData.map(function (candle) {
                    var adjustedHigh = Math.min(+candle.high, +candle.vwap * 1.5),
                        adjustedLow = Math.max(+candle.low, +candle.vwap / 2);

                    return {
                        date: candle.timestamp,
                        open: +candle.open,
                        high: adjustedHigh,
                        low: adjustedLow,
                        close: +candle.close,
                        volume: +candle.volume
                    };
                }).sort(function (a, b) {
                    return d3.ascending(self.accessor.d(a), self.accessor.d(b));
                }).map(function (c) {
                    if (c.open === 0 && c.high === 0 && c.low === 0 && c.close === 0) {
                        c.open = c.high = c.low = c.close = lastTradePrice;
                    } else {
                        lastTradePrice = c.close;
                    }

                    return c;
                });
            };

            return {
                create: function (type, $element) {
                    if (type === 'candlestick') {
                        return new CandlestickChart($element);
                    }
                }
            };
        }]);
})();
