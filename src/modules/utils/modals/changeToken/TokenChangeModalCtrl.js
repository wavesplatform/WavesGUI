(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param createPoll
     * @param {app.utils} utils
     * @param {Waves} waves
     * @param {User} user
     * @return {TokenChangeModalCtrl}
     */
    const controller = function (Base, $scope, createPoll, utils, waves, user) {

        class TokenChangeModalCtrl extends Base {

            constructor({ money, txType }) {
                super($scope);
                /**
                 * @type {number}
                 */
                this.step = 0;
                /**
                 * @type {boolean}
                 */
                this.noFee = false;
                /**
                 * @type {'burn'|'reissue'}
                 */
                this.txType = txType;
                /**
                 * @type {ExtendedAsset}
                 */
                this.asset = money.asset;
                /**
                 * @type {boolean}
                 */
                this.issue = money.asset.reissuable;
                /**
                 * @type {BigNumber}
                 */
                this.maxCoinsCount = WavesApp.maxCoinsCount.sub(money.asset.quantity);
                /**
                 * @type {Money}
                 */
                this.balance = money;
                /**
                 * @type {Money}
                 */
                this.precision = money.asset.precision;
                /**
                 * @type {Precision}
                 */
                this.input = null;
                /**
                 * @type {Money}
                 * @private
                 */
                this._waves = null;

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

                waves.node.getFee({ type: this.txType }).then((fee) => {
                    this.fee = fee;
                    $scope.$digest();
                });

                createPoll(this, this._getGraphData, 'chartData', 15000);
                createPoll(this, this._getWavesBalance, '_waves', 1000);

                this.observe(['input', 'issue'], this._createTx);
                this.observe('_waves', this._changeHasFee);
            }

            _getWavesBalance() {
                return waves.node.assets.balance(WavesApp.defaultAssets.WAVES).then(({ available }) => available);
            }

            _changeHasFee() {
                this.noFee = this._waves.lt(this.fee);
            }

            _createTx() {
                const input = this.input;

                if (input) {
                    this.tx = waves.node.transactions.createTransaction(this.txType, {
                        assetId: input.asset.id,
                        description: input.asset.description,
                        fee: this.fee,
                        quantity: input,
                        precision: input.asset.precision,
                        reissuable: this.issue
                    });
                } else {
                    this.tx = null;
                }
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

        const { money, txType } = this;
        return new TokenChangeModalCtrl({ money, txType });
    };

    controller.$inject = ['Base', '$scope', 'createPoll', 'utils', 'waves', 'user'];

    angular.module('app.utils').controller('TokenChangeModalCtrl', controller);
})();
