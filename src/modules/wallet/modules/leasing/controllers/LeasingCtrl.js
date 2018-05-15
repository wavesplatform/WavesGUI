(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @param {Waves} waves
     * @param {ModalManager} modalManager
     * @param {IPollCreate} createPoll
     * @return {LeasingCtrl}
     */
    const controller = function (Base, $scope, utils, waves, modalManager, createPoll) {

        class LeasingCtrl extends Base {

            get pendingAllLeasing() {
                return !this.pending && this.allActiveLeasing == null;
            }

            constructor() {
                super($scope);

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

                /**
                 * @type {ITransaction[]}
                 * @private
                 */
                this.txList = null;
                /**
                 * @type {ITransaction[]}
                 */
                this.allActiveLeasing = null;
                /**
                 * @type {ITransaction[]}
                 */
                this.transactions = [];

                /**
                 * @type {string}
                 */
                this.nodeListLink = WavesApp.network.nodeList;

                waves.node.transactions.getActiveLeasingTx().then((txList) => {
                    this.allActiveLeasing = txList;
                });

                createPoll(this, this._getBalances, this._setLeasingData, 1000, { isBalance: true });
                createPoll(this, this._getTransactions, this._setTxList, 3000, { isBalance: true });

                this.observe(['txList', 'allActiveLeasing'], this._currentLeasingList);
            }

            startLeasing() {
                return modalManager.showStartLeasing();
            }

            /**
             * @return {Promise<IBalanceDetails>}
             * @private
             */
            _getBalances() {
                return waves.node.assets.balance(WavesApp.defaultAssets.WAVES);
            }

            /**
             * @private
             */
            _getTransactions() {
                return waves.node.transactions.list(5000);
            }

            /**
             * @param {BigNumber} available
             * @param {BigNumber} leasedIn
             * @param {BigNumber} leased
             * @private
             */
            _setLeasingData({ leasedOut, leasedIn, available }) {
                this.available = available;
                this.leased = leasedOut;
                this.leasedIn = leasedIn;
                this.total = available.add(leasedOut);

                this.chartData = [
                    { id: 'available', value: available },
                    { id: 'leased', value: leasedOut },
                    { id: 'leasedIn', value: leasedIn }
                ];
                $scope.$digest();
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

                this.txList = txList.filter(({ type }) => AVAILABLE_TYPES_HASH[type]);
                $scope.$digest();
            }

            /**
             * @private
             */
            _currentLeasingList() {
                const txList = this.txList;
                const allActiveLeasing = this.allActiveLeasing;

                if (!txList) {
                    return null;
                }

                this.pending = !txList.length && !allActiveLeasing;

                if (!allActiveLeasing || !allActiveLeasing.length) {
                    this.transactions = txList.slice();
                    return null;
                }

                const idHash = utils.toHash(txList, 'id');
                const result = txList.slice();

                allActiveLeasing.forEach((tx) => {
                    if (!idHash[tx.id]) {
                        result.push(tx);
                    }
                });

                this.transactions = result;
            }

        }

        return new LeasingCtrl();
    };

    controller.$inject = ['Base', '$scope', 'utils', 'waves', 'modalManager', 'createPoll'];

    angular.module('app.wallet.leasing').controller('LeasingCtrl', controller);
})();
