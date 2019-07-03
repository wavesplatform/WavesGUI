(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param $state
     * @param user
     * @param modalManager
     * @param storage
     * @param ChartFactory
     * @param {app.utils} utils
     * @param {JQuery} $element
     * @param {Waves} waves
     * @return {WelcomeCtrl}
     */
    const controller = function (Base,
                                 $scope,
                                 $state,
                                 user,
                                 modalManager,
                                 utils,
                                 waves,
                                 $element,
                                 ChartFactory,
                                 storage) {

        const ds = require('data-service');
        const { Money } = require('@waves/data-entities');
        const { flatten } = require('ramda');

        const WCT_ID = WavesApp.network.code === 'T' ?
            WavesApp.defaultAssets.TRY :
            'DHgwrRvVyqJsepd32YbBqUeDH4GJ1N984X8QoekjgH8J';

        const PAIRS_IN_SLIDER = [
            {
                amount: WavesApp.defaultAssets.VST,
                price: 'WAVES'
            },
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

                if (WavesApp.isWeb()) {
                    storage.load('accountImportComplete')
                        .then((complete) => {
                            if (complete) {
                                this._initUserList();
                            } else {
                                this._loadUserListFromOldOrigin();
                            }
                        });
                } else {
                    this._initUserList();
                }
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
                utils.openDex(pairAssets.assetId1, pairAssets.assetId2, 'dex-demo');
            }

            /**
             * @private
             */
            _initPairs() {
                const FAKE_RATE_HISTORY = [{
                    rate: new BigNumber(0),
                    timestamp: ds.utils.normalizeTime(Date.now())
                }];

                const startDate = utils.moment().add().day(-7);
                Promise.all(PAIRS_IN_SLIDER.map(pair => ds.api.pairs.get(pair.amount, pair.price)))
                    .then(pairs => Promise.all(pairs.map(pair => ds.api.pairs.info(pair))))
                    .then(infoList => {
                        const flattenInfoList = flatten(infoList);

                        Promise.all(
                            PAIRS_IN_SLIDER
                                .map(({ amount, price }) => waves.utils.getRateHistory(amount, price, startDate))
                                .map(promise => promise.catch(() => FAKE_RATE_HISTORY))
                        )
                            .then(rateHistory => {
                                this.pairsInfoList = rateHistory.map(WelcomeCtrl._fillValues(flattenInfoList));
                            })
                            .then(() => {
                                utils.safeApply($scope);
                                this._insertCharts();
                                this._addScrollHandler();
                            });
                    });
            }

            /**
             * @param {array} infoList
             * @static
             */
            static _fillValues(infoList) {
                return (rateHistory, i) => {
                    const info = infoList[i];
                    const volume = info.volume || new Money(0, info.priceAsset);
                    return {
                        ...info,
                        ticker: info.ticker || info.displayName,
                        change24: info.change24 || new BigNumber(0),
                        high: info.high || new Money(0, info.priceAsset),
                        lastPrice: info.lastPrice || new Money(0, info.priceAsset),
                        low: info.low || new Money(0, info.priceAsset),
                        volume,
                        rateHistory,
                        volumeBigNum: volume.getTokens()
                    };
                };
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
                user.getFilteredUserList()
                    .then((list) => {
                        this.userList = list;
                        this.pendingRestore = false;
                        setTimeout(() => {
                            $scope.$apply(); // TODO FIX!
                        }, 100);
                    });
            }

            /**
             * @private
             */
            _loadUserListFromOldOrigin() {
                const OLD_ORIGIN = 'https://client.wavesplatform.com';

                this.pendingRestore = true;

                utils.importAccountByIframe(OLD_ORIGIN, 5000)
                    .then((userList) => {
                        this.pendingRestore = false;
                        this.userList = userList || [];

                        storage.save('accountImportComplete', true);
                        storage.save('userList', userList);

                        $scope.$apply();
                    })
                    .catch(() => {
                        this._initUserList();
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
        'ChartFactory',
        'storage'
    ];

    angular.module('app.welcome')
        .controller('WelcomeCtrl', controller);
})();
