(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @param {Waves} waves
     * @param {ModalManager} modalManager
     * @param {IPollCreate} createPoll
     * @param {BalanceWatcher} balanceWatcher
     * @return {LeasingCtrl}
     */
    const controller = function (Base, $scope, utils, waves, modalManager, createPoll, balanceWatcher) {

        const { pathEq } = require('ramda');

        class LeasingCtrl extends Base {

            get pendingAllLeasing() {
                return !this.pending && this.allActiveLeasing == null;
            }

            /**
             * @type {string}
             */
            filter;
            /**
             * @type {ITransaction[]}
             * @private
             */
            _txList = null;
            /**
             * @type {ITransaction[]}
             */
            allActiveLeasing = null;
            /**
             * @type {ITransaction[]}
             */
            transactions = [];
            /**
             * @type {string}
             */
            nodeListLink = '';


            constructor() {
                super($scope);

                this.syncSettings({ filter: 'wallet.leasing.filter' });
                this.pending = true;
                this.chartOptions = {
                    items: {
                        available: {
                            color: '#66bf00',
                            radius: 80
                        },
                        leased: {
                            color: '#ffebc0',
                            radius: 64
                        },
                        leasedIn: {
                            color: '#bacaf5',
                            radius: 75
                        }
                    },
                    center: 34,
                    direction: true,
                    startFrom: Math.PI / 2
                };

                this.nodeListLink = WavesApp.network.nodeList;

                waves.node.transactions.getActiveLeasingTx().then((txList) => {
                    this.allActiveLeasing = txList;
                    $scope.$apply();
                });

                createPoll(this, this._getTransactions, this._setTxList, 3000, { isBalance: true });

                this.receive(balanceWatcher.change, this._updateLeasingData, this);
                this.observe(['_txList', 'allActiveLeasing'], this._currentLeasingList);
                this.observe('filter', this._filterLeasingList);

                this._updateLeasingData();
            }

            /**
             * @return {object}
             * @public
             */
            startLeasing() {
                return modalManager.showStartLeasing();
            }

            /**
             * @private
             */
            _getTransactions() {
                return waves.node.transactions.list(500);
            }

            /**
             * @private
             */
            _updateLeasingData() {
                const waves = balanceWatcher.getFullBalanceList().find(pathEq(['asset', 'id'], 'WAVES'));

                if (!waves) {
                    return null;
                }

                const { available, leasedOut, leasedIn } = waves;

                this.available = available;
                this.leased = leasedOut;
                this.leasedIn = leasedIn;
                this.total = available.add(leasedOut);

                this.chartData = [
                    { id: 'available', value: available },
                    { id: 'leased', value: leasedOut },
                    { id: 'leasedIn', value: leasedIn }
                ];
                utils.safeApply($scope);
            }

            /**
             * @param {ITransaction[]} txList
             * @private
             */
            _setTxList(txList) {
                const AVAILABLE_TYPES_HASH = {
                    [waves.node.transactions.TYPES.LEASE_IN]: true,
                    [waves.node.transactions.TYPES.LEASE_OUT]: true,
                    [waves.node.transactions.TYPES.CANCEL_LEASING]: true
                };

                this._txList = txList.filter(({ typeName }) => AVAILABLE_TYPES_HASH[typeName]);
                this.pending = false;
                $scope.$apply();
            }

            /**
             * @private
             */
            _currentLeasingList() {
                const txList = this._txList;
                const allActiveLeasing = this.allActiveLeasing;

                if (!txList) {
                    return null;
                }

                this.pending = !txList.length && !allActiveLeasing;

                const idHash = utils.toHash(txList, 'id');
                const result = txList.slice();

                allActiveLeasing.forEach((tx) => {
                    if (!idHash[tx.id]) {
                        result.push(tx);
                    }
                });

                this.transactions = result;
                this._filterLeasingList();
            }

            /*
             * @private
             */
            _filterLeasingList() {
                this.pending = true;
                const filter = this.filter;
                if (filter === 'active') {
                    this.transactions = this.transactions.filter(tx => tx.status === 'active');
                } else if (filter === 'canceled') {
                    this.transactions = this.transactions
                        .filter(tx => tx.status !== 'active' || tx.typeName === 'cancel-leasing');
                }
            }

        }

        return new LeasingCtrl();
    };

    controller.$inject = ['Base', '$scope', 'utils', 'waves', 'modalManager', 'createPoll', 'balanceWatcher'];

    angular.module('app.wallet.leasing').controller('LeasingCtrl', controller);
})();
