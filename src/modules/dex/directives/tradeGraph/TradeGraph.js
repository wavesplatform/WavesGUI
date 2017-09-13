(function () {
    'use strict';

    const controller = function () {

        class TradeGraph {

            constructor() {
                this.options = {
                    margin: {
                        left: -1,
                        top: 20,
                        right: -1,
                        bottom: 0
                    },
                    grid: {
                        x: false,
                        y: false
                    },
                    series: [
                        {
                            dataset: 'by',
                            key: 'y',
                            label: 'An area series',
                            color: '#F27057',
                            type: ['line', 'line', 'area']
                        },
                        {
                            dataset: 'sell',
                            key: 'y',
                            label: 'An area series',
                            color: '#2B9F72',
                            type: ['line', 'line', 'area']
                        }
                    ],
                    axes: {
                        x: { key: 'x', type: 'linear', ticks: 10 },
                        y: { key: 'y', ticks: 4 }
                    }
                };

                this.by = [];
                this.sell = [];

                this.data = {
                    by: [],
                    sell: []
                };
            }

            $onChanges(changes) {
                if (changes.by || changes.sell) {
                    this.data = {
                        by: this.by.map((item) => ({ x: -item.price, y: item.size })),
                        sell: this.by.map((item) => ({ x: item.price, y: item.size }))
                    };
                }
            }

        }

        return new TradeGraph();
    };

    controller.$inject = [];

    angular.module('app.dex')
        .component('wDexTradeGraph', {
            bindings: {
                sell: '<',
                by: '<'
            },
            templateUrl: '/modules/dex/directives/tradeGraph/tradeGraph.html',
            controller
        });
})();
