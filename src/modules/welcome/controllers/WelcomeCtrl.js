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
                                 ChartFactory,
                                 storage,
                                 utils) {

        const ds = require('data-service');
        const { flatten } = require('ramda');

        const PAIRS_IN_SLIDER = [
            {
                amount: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS',
                price: 'WAVES'
            },
            {
                amount: 'DHgwrRvVyqJsepd32YbBqUeDH4GJ1N984X8QoekjgH8J',
                price: 'WAVES'
            },
            {
                amount: 'B3uGHFRpSUuGEDWjqB9LWWxafQj8VTvpMucEyoxzws5H',
                price: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS'
            },
            {
                amount: '474jTeYx2r2Va35794tCScAXWJG9hU2HcgxzMowaZUnu',
                price: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS'
            },
            {
                amount: 'zMFqXuoyrn5w17PFurTqxB7GsS71fp9dfk6XFwxbPCy',
                price: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS'
            },
            {
                amount: '474jTeYx2r2Va35794tCScAXWJG9hU2HcgxzMowaZUnu',
                price: 'WAVES'
            },
            {
                amount: 'WAVES',
                price: 'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck'
            },
            {
                amount: 'BrjUWjndUanm5VsJkbUip8VRYy6LWJePtxya3FNv4TQa',
                price: 'WAVES'
            },
            {
                amount: '5WvPKSJXzVE2orvbkJ8wsQmmQKqTv9sGBPksV4adViw3',
                price: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS'
            },
            {
                amount: 'HZk1mbfuJpmxU1Fs4AX5MWLVYtctsNcg6e2C6VKqK8zk',
                price: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS'
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
                    // storage.load('accountImportComplete')
                    //     .then((complete) => {
                    //         if (complete) {
                    //             this._initUserList();
                    //         } else {
                    //             this._loadUserListFromOldOrigin();
                    //         }
                    //     });
                    this._loadUserListFromOldOrigin();
                } else {
                    this._initUserList();
                }
                // this._initPairs();
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
                const OLD_ORIGIN = 'https://localhost:8080';
                this.pendingRestore = true;
                utils.importAccountByIframe(OLD_ORIGIN, 20000)
                    .then((userList) => {
                        this.userList = userList || [];

                        $scope.$apply();

                        storage.save('accountImportComplete', this.userList.length > 0);
                        storage.save('userList', userList);
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
        'storage',
        'utils'
    ];

    angular.module('app.welcome')
        .controller('WelcomeCtrl', controller);
})();
