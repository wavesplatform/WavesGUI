(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param $state
     * @param user
     * @param modalManager
     * @param ChartFactory
     * @param {app.utils} angularUtils
     * @param {JQuery} $element
     * @param {Waves} waves
     * @return {WelcomeCtrl}
     */
    const controller = function (Base,
                                 $scope,
                                 $state,
                                 user,
                                 modalManager,
                                 angularUtils,
                                 waves,
                                 $element,
                                 ChartFactory) {

        const ds = require('data-service');
        const { utils } = require('@waves/signature-generator');
        const { Money } = require('@waves/data-entities');
        const { flatten } = require('ramda');

        const WCT_ID = WavesApp.network.code === 'T' ?
            WavesApp.defaultAssets.VST :
            'DHgwrRvVyqJsepd32YbBqUeDH4GJ1N984X8QoekjgH8J';

        const PAIRS_IN_SLIDER = [
            {
                amount: WavesApp.defaultAssets.BTC,
                price: 'WAVES'
            },
            {
                amount: WCT_ID,
                price: 'WAVES'
            },
            {
                amount: WavesApp.defaultAssets.DASH,
                price: WavesApp.defaultAssets.BTC
            },
            {
                amount: WavesApp.defaultAssets.ETH,
                price: WavesApp.defaultAssets.BTC
            },
            {
                amount: WavesApp.defaultAssets.BCH,
                price: WavesApp.defaultAssets.BTC
            },
            {
                amount: WavesApp.defaultAssets.ETH,
                price: 'WAVES'
            },
            {
                amount: 'WAVES',
                price: WavesApp.defaultAssets.USD
            },
            {
                amount: WavesApp.defaultAssets.ZEC,
                price: 'WAVES'
            },
            {
                amount: WavesApp.defaultAssets.XMR,
                price: WavesApp.defaultAssets.BTC
            },
            {
                amount: WavesApp.defaultAssets.LTC,
                price: WavesApp.defaultAssets.BTC
            }
        ];


        const chartOptions = {
            red: {
                charts: [
                    {
                        axisX: 'timestamp',
                        axisY: 'rate',
                        lineColor: '#ef4829',
                        fillColor: '#FFF',
                        gradientColor: ['#FEEFEC', '#FFF'],
                        lineWidth: 4
                    }
                ]
            },
            blue: {
                charts: [
                    {
                        axisX: 'timestamp',
                        axisY: 'rate',
                        lineColor: '#1f5af6',
                        fillColor: '#FFF',
                        gradientColor: ['#EAF0FE', '#FFF'],
                        lineWidth: 4
                    }
                ]
            }
        };

        const whenHeaderGetFix = 60;

        class WelcomeCtrl extends Base {

            /**
             * @type {Array}
             * @public
             */
            pairsInfoList = [];


            constructor() {
                super($scope);

                this._initUserList();
                this._initPairs();
            }

            /**
             * @private
             */
            _addScrollHandler() {
                const scrolledView = $element.find('.scrolled-view');
                const header = $element.find('w-site-header');
                scrolledView.on('scroll', () => {
                    header.toggleClass('fixed', scrolledView.scrollTop() > whenHeaderGetFix);
                    header.toggleClass('unfixed', scrolledView.scrollTop() <= whenHeaderGetFix);
                });
            }

            /**
             * @public
             */
            showTutorialModals() {
                return modalManager.showTutorialModals();
            }

            /**
             * @public
             */
            goToDexDemo(pairAssets) {
                angularUtils.openDex(pairAssets.assetId1, pairAssets.assetId2, 'dex-demo');
            }

            /**
             * @private
             */
            _initPairs() {
                const startDate = angularUtils.moment().add().day(-7);
                Promise.all(PAIRS_IN_SLIDER.map(pair => ds.api.pairs.get(pair.amount, pair.price)))
                    .then(pairs => Promise.all(pairs.map(pair => ds.api.pairs.info(pair))))
                    .then(infoList => {
                        const tempInfoList = flatten(infoList);
                        Promise.all(tempInfoList.map(info => {
                            return waves.utils.getRateHistory(info.amountAsset.id, info.priceAsset.id, startDate);
                        })).then(rateHistory => {
                            this.pairsInfoList = tempInfoList.map((info, i) => {
                                return {
                                    rateHistory: rateHistory[i],
                                    ...info
                                };
                            });
                        })
                            .catch(() => {
                                this.pairsInfoList = tempInfoList.map(info => {
                                    return {
                                        rateHistory: [{
                                            rate: new BigNumber(0),
                                            timestamp: ds.utils.normalizeTime(Date.now())
                                        }],
                                        ticker: info.displayName,
                                        amountAsset: info.amountAsset,
                                        priceAsset: info.priceAsset,
                                        change24: new BigNumber(0),
                                        high: new Money(0, info.priceAsset),
                                        id: info.id,
                                        lastPrice: new Money(0, info.priceAsset),
                                        low: new Money(0, info.priceAsset),
                                        volume: new Money(0, info.priceAsset)
                                    };
                                });
                            })
                            .then(() => {
                                angularUtils.safeApply($scope);
                                this._insertCharts();
                                this._addScrollHandler();
                            });
                    });
            }

            /**
             * @private
             */
            _insertCharts() {
                const marketRows = $element.find('.table-markets .row-content');
                PAIRS_IN_SLIDER.forEach((pair, i) => {
                    const options = this.pairsInfoList[i].change24.gt(0) ? chartOptions.blue : chartOptions.red;
                    new ChartFactory(
                        marketRows.eq(i).find('.graph'),
                        options,
                        this.pairsInfoList[i].rateHistory
                    );
                });
            }


            /**
             * @private
             */
            _initUserList() {
                user.getUserList()
                    .then((list) => {
                        this.userList = list.filter(user => utils.crypto.isValidAddress(user.address));
                        this.pendingRestore = false;
                        setTimeout(() => {
                            $scope.$apply(); // TODO FIX!
                        }, 100);
                    });
            }

        }

        return new WelcomeCtrl();
    };

    controller.$inject = [
        'Base',
        '$scope',
        '$state',
        'user',
        'modalManager',
        'utils',
        'waves',
        '$element',
        'ChartFactory'
    ];

    angular.module('app.welcome')
        .controller('WelcomeCtrl', controller);
})();
