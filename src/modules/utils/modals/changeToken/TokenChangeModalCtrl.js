(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param createPoll
     * @param {app.utils} utils
     * @param {Waves} waves
     * @param {User} user
     * @return {TokenChangeModalCtrl}
     */
    const controller = function (Base, $scope, createPoll, utils, waves, user) {

        class TokenChangeModalCtrl extends Base {

            constructor({ money, mod }) {
                super($scope);
                /**
                 * @type {number}
                 */
                this.step = 0;
                /**
                 * @type {'burn'|'reissue'}
                 */
                this.txType = mod;
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
                this.input = null;

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

                this.observe('input', this._createTx);
            }

            _createTx() {
                const input = this.input;
                this.tx = waves.node.transactions.createTransaction(this.txType, {
                    assetId: input.asset.id,
                    description: input.asset.description,
                    fee: this.fee,
                    quantity: input,
                    precision: input.asset.precision,
                    reissuable: input.asset.reissuable
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

        const { money, mod } = this;
        return new TokenChangeModalCtrl({ money, mod });
    };

    controller.$inject = ['Base', '$scope', 'createPoll', 'utils', 'waves', 'user'];

    angular.module('app.utils').controller('TokenChangeModalCtrl', controller);
})();
