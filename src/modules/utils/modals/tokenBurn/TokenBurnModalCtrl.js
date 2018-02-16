(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param createPoll
     * @param {app.utils} utils
     * @param {Waves} waves
     * @param {User} user
     * @return {TokenBurnModalCtrl}
     */
    const controller = function (Base, $scope, createPoll, utils, waves, user) {

        class TokenBurnModalCtrl extends Base {

            constructor(money) {
                super($scope);
                /**
                 * @type {number}
                 */
                this.step = 0;
                /**
                 * @type {ExtendedAsset}
                 */
                this.asset = money.asset;
                /**
                 * @type {Money}
                 */
                this.balance = money;
                /**
                 * @type {Money}
                 */
                this.burn = null;

                this.options = {
                    grid: {
                        x: false,
                        y: false
                    },
                    margin: {
                        top: 0,
                        right: 0,
                        left: 0,
                        bottom: 0
                    },
                    series: [
                        {
                            dataset: 'values',
                            key: 'rate',
                            label: 'Rate',
                            color: '#5a81ea',
                            type: ['line', 'area']
                        }
                    ],
                    axes: {
                        x: {
                            key: 'timestamp',
                            type: 'date',
                            ticks: 4
                        }
                    }
                };

                utils.when(waves.node.getFee('burn')).then((fee) => {
                    this.fee = fee;
                });

                createPoll(this, this._getGraphData, 'chartData', 15000);

                this.observe('burn', this._createTx);
            }

            _createTx() {
                const burn = this.burn;
                this.tx = waves.node.transactions.createTransaction('burn', {
                    assetId: burn.asset.id,
                    description: burn.asset.description,
                    fee: this.fee,
                    quantity: burn,
                    precision: burn.asset.precision,
                    reissuable: burn.asset.reissuable
                });
            }

            /**
             * @return {Promise<{values: {rate: number, timestamp: Date}[]}>}
             * @private
             */
            _getGraphData() {
                const startDate = utils.moment().add().day(-100);
                return waves.utils.getRateHistory(this.asset.id, user.getSetting('baseAssetId'), startDate)
                    .then((values) => ({ values }));
            }

        }

        return new TokenBurnModalCtrl(this.money);
    };

    controller.$inject = ['Base', '$scope', 'createPoll', 'utils', 'waves', 'user'];

    angular.module('app.utils').controller('TokenBurnModalCtrl', controller);
})();
