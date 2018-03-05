(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {app.utils} utils
     * @param {Waves} waves
     * @param {ModalManager} modalManager
     * @param createPoll
     * @return {LeasingCtrl}
     */
    const controller = function (Base, $scope, utils, waves, modalManager, createPoll) {

        class LeasingCtrl extends Base {

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
                this._txList = [];
                /**
                 * @type {ITransaction[]}
                 * @private
                 */
                this._allActiveLeasing = [];
                /**
                 * @type {ITransaction[]}
                 */
                this.transactions = [];

                waves.node.transactions.getActiveLeasingTx().then((txList) => {
                    this._allActiveLeasing = txList;
                });

                createPoll(this, this._getBalances, this._setLeasingData, 1000, { isBalance: true });
                createPoll(this, this._getTransactions, this._setTxList, 3000, { isBalance: true });

                this.observe(['_txList', '_allActiveLeasing'], this._currentLeasingList);
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
            }

            /**
             * @param {ITransaction[]} txList
             * @private
             */
            _setTxList(txList) {
                this.pending = false;

                const AVAILABLE_TYPES_HASH = {
                    [waves.node.transactions.TYPES.LEASE_IN]: true,
                    [waves.node.transactions.TYPES.LEASE_OUT]: true,
                    [waves.node.transactions.TYPES.CANCEL_LEASING]: true
                };

                this._txList = txList.filter(({ type }) => AVAILABLE_TYPES_HASH[type]);
            }

            /**
             * @private
             */
            _currentLeasingList() {
                const txList = this._txList;

                if (!this._allActiveLeasing.length) {
                    this.transactions = txList.slice();
                    return null;
                }

                const idHash = utils.toHash(txList, 'id');
                const result = txList.slice();

                this._allActiveLeasing.forEach((tx) => {
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
