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
        const analytics = require('@waves/event-sender');
        const PATH = 'modules/welcome/templates';
        const { utils } = require('@waves/signature-generator');
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
                        lineWidth: 3
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
                        lineWidth: 3
                    }
                ]
            }
        };

        const whenHeaderGetFix = 60;

        class WelcomeCtrl extends Base {

            /**
             * @type {boolean}
             */
            networkError = false;
            /**
             * @type {string}
             */
            password = '';
            /**
             * @type {null}
             */
            loginForm = null;
            /**
             * @type {string}
             */
            activeUserAddress = null;
            /**
             * @type {boolean}
             */
            needPassword = true;
            /**
             * @type {number}
             * @private
             */
            _activeUserIndex = null;
            /**
             * @type {Array}
             * @public
             */
            pairsInfoList = [];

            get user() {
                return this.userList[this._activeUserIndex];
            }

            get encryptedSeed() {
                return this.user.encryptedSeed;
            }

            constructor() {
                super($scope);

                this.observe('activeUserAddress', this._calculateActiveIndex);
                this.observe('password', this._updatePassword);

                analytics.send({ name: 'Sign In Show', target: 'ui', params: { from: 'welcome' } });
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
            _updatePassword() {
                if (this.password) {
                    this.showPasswordError = false;
                    this.networkError = false;
                }
            }

            login() {
                try {
                    this.networkError = false;
                    this.showPasswordError = false;
                    const userSettings = user.getSettingsByUser(this.user);
                    const activeUser = { ...this.user, password: this.password, settings: userSettings };
                    const api = ds.signature.getDefaultSignatureApi(activeUser);
                    const adapterAvailablePromise = api.isAvailable();

                    let canLoginPromise;

                    if (this._isSeedAdapter(api)) {
                        canLoginPromise = adapterAvailablePromise.then(() => api.getAddress())
                            .then(address => address === activeUser.address ? true : Promise.reject('Wrong address!'));
                    } else {
                        canLoginPromise = modalManager.showLoginByDevice(adapterAvailablePromise, api.type);
                    }

                    return canLoginPromise.then(() => {
                        return user.login({
                            api,
                            userType: api.type,
                            password: this.password,
                            address: activeUser.address
                        });
                    }, () => {
                        if (!this._isSeedAdapter(api)) {
                            const errorData = {
                                error: 'load-user-error',
                                userType: api.type,
                                address: activeUser.address
                            };
                            return modalManager.showSignDeviceError(errorData)
                                .catch(() => Promise.resolve());
                        } else {
                            this._showPasswordError();
                        }
                    });
                } catch (e) {
                    this._showPasswordError();
                }
            }

            /**
             * @param {string} address
             */
            removeUser(address) {
                const user = this.userList.find((user) => user.address === address);
                modalManager.showConfirmDeleteUser(user).then(() => {
                    this._deleteUser(address);
                });
            }

            /**
             * @param {Adapter} api
             * @return boolean
             * @private
             */
            _isSeedAdapter(api) {
                return api.type && api.type === 'seed';
            }

            /**
             * @private
             */
            _showPasswordError() {
                this.password = '';
                this.showPasswordError = true;
                this.networkError = this.user.networkError;
            }

            /**
             * @private
             */
            _deleteUser(address) {
                user.removeUserByAddress(address);
                this.userList = this.userList.filter((user) => user.address !== address);
                this._updateActiveUserAddress();
            }

            /**
             * @private
             */
            _initUserList() {
                user.getUserList()
                    .then((list) => {
                        this.userList = list.filter(user => utils.crypto.isValidAddress(user.address));
                        this.pendingRestore = false;
                        this._updateActiveUserAddress();
                        setTimeout(() => {
                            $scope.$apply(); // TODO FIX!
                        }, 100);
                    });
            }

            /**
             * @private
             */
            _updateActiveUserAddress() {
                if (this.userList.length) {
                    this.activeUserAddress = this.userList[0].address;
                    this.needPassword = !this.userList[0].userType || this.userList[0].userType === 'seed';
                } else {
                    this.activeUserAddress = null;
                    this.needPassword = true;
                }
                this._updatePageUrl();
            }

            /**
             * @private
             */
            _updatePageUrl() {
                if (this.userList.length) {
                    this.pageUrl = `${PATH}/welcomeHasUsers.html`;
                } else {
                    this.pageUrl = `${PATH}/welcomeNewUser.html`;
                }
            }

            /**
             * @private
             */
            _calculateActiveIndex() {
                const activeAddress = this.activeUserAddress;
                let index = null;

                if (!activeAddress) {
                    return null;
                }

                this.userList.some(({ address }, i) => {
                    if (address === activeAddress) {
                        index = i;
                        return true;
                    }
                    return false;
                });

                this._activeUserIndex = index;
                this.needPassword = !this.userList[index].userType || this.userList[index].userType === 'seed';
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
