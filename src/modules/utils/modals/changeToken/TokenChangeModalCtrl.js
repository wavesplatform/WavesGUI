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

        const entities = require('@waves/data-entities');
        const { SIGN_TYPE } = require('@waves/signature-adapter');

        const ds = require('data-service');
        const { path } = require('ramda');
        const { STATUS_LIST } = require('@waves/oracle-data');

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
                this.maxCoinsCount = WavesApp.maxCoinsCount.minus(money.asset.quantity);
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
                 */
                this.quantity = new entities.Money(this.asset.quantity, this.asset);
                /**
                 * @type {Money}
                 * @private
                 */
                this._waves = null;

                const data = ds.dataManager.getOracleAssetData(money.asset.id);
                this.isVerified = path(['status'], data) === STATUS_LIST.VERIFIED;
                this.isGateway = path(['status'], data) === 3;
                this.ticker = money.asset.ticker;

                const { TokenChangeModalCtrl = {} } = user.getThemeSettings();

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
                            color: TokenChangeModalCtrl.seriesColor || '#5a81ea',
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
                this.observe(['_waves', 'fee'], this._changeHasFee);
            }

            getSignable() {
                return this.signable;
            }

            next() {
                this.step++;
            }

            _getWavesBalance() {
                return waves.node.assets.balance(WavesApp.defaultAssets.WAVES).then(({ available }) => available);
            }

            _changeHasFee() {
                if (!this._waves || !this.fee) {
                    return null;
                }

                this.noFee = this._waves.lt(this.fee);
            }

            _createTx() {
                const input = this.input;
                const type = this.txType === 'burn' ? SIGN_TYPE.BURN : SIGN_TYPE.REISSUE;
                const quantityField = this.txType === 'burn' ? 'amount' : 'quantity';


                if (input) {
                    const tx = waves.node.transactions.createTransaction({
                        type,
                        assetId: input.asset.id,
                        description: input.asset.description,
                        fee: this.fee,
                        [quantityField]: input,
                        precision: input.asset.precision,
                        reissuable: this.issue
                    });
                    this.signable = ds.signature.getSignatureApi().makeSignable({
                        type,
                        data: tx
                    });
                } else {
                    this.tx = null;
                    this.signable = null;
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
