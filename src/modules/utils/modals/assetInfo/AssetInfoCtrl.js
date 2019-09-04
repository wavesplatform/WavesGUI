(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {User} user
     * @param {IPollCreate} createPoll
     * @param {app.utils} utils
     * @param {Waves} waves
     * @return {AssetInfoCtrl}
     */
    const controller = function (Base, $scope, user, createPoll, utils, waves) {

        const ds = require('data-service');
        const { BigNumber } = require('@waves/bignumber');

        class AssetInfoCtrl extends Base {

            /**
             * @param {Asset} asset
             */
            constructor(asset) {
                super($scope);
                this.asset = asset;
                this.wavesId = WavesApp.defaultAssets.WAVES;
                this.isDemo = !user.address;
                this.quantity = this.asset.quantity.div(new BigNumber(10).pow(this.asset.precision)).toFormat();
                this.minFee = ds.utils.getTransferFeeList().find(money => money.asset.id === this.asset.id);
                const assetList = user.getSetting('pinnedAssetIdList');
                this.assetList = assetList;
                this.pinned = assetList.indexOf(asset.id) !== -1;
                this.circleChartData = null;
                this.totalBalance = null;
                this.transactions = [];
                this.transactionsPending = true;

                const {
                    link, email, provider, description
                } = utils.getDataFromOracles(this.asset.id);

                // this.ticker = path(['ticker'], data); // TODO STEP 2=
                this.link = link;

                this.email = email;

                this.provider = provider;
                this.description = description || asset.description;

                this.withScam = null;
                this.spam = [];

                /**
                 * @type {string}
                 */
                this.tab = 'info';

                this.chartOptions = {
                    items: {
                        available: {
                            color: '#66bf00',
                            radius: 66
                        },
                        leased: {
                            color: '#ffebc0',
                            radius: 50
                        },
                        inOrders: {
                            color: '#bacaf5',
                            radius: 58
                        }
                    },
                    center: 27,
                    direction: true,
                    startFrom: Math.PI / 2
                };

                if (!this.isDemo) {
                    const isBalance = true;
                    createPoll(this, this._getCircleGraphData, this._setCircleGraphData, 15000);
                    createPoll(this, AssetInfoCtrl._getTxList, this._setTxList, 4000, { isBalance, $scope });
                }
            }

            togglePin() {
                this.assetList = this.assetList.filter(tsUtils.notContains(this.asset.id));
                if (!this.pinned) {
                    this.assetList = this.assetList.concat(this.asset.id);
                }
                this.pinned = !this.pinned;
                user.setSetting('pinnedAssetIdList', this.assetList);
            }

            _setTxList(transactions) {
                this.transactionsPending = false;

                this.transactions = transactions.filter((tx) => {
                    const TYPES = waves.node.transactions.TYPES;

                    switch (tx.typeName) {
                        case TYPES.SEND:
                        case TYPES.RECEIVE:
                        case TYPES.MASS_RECEIVE:
                        case TYPES.MASS_SEND:
                        case TYPES.CIRCULAR:
                            return tx.amount.asset.id === this.asset.id;
                        case TYPES.EXCHANGE_BUY:
                        case TYPES.EXCHANGE_SELL:
                            return (
                                tx.amount.asset.id === this.asset.id ||
                                tx.price.asset.id === this.asset.id
                            );
                        case TYPES.LEASE_IN:
                        case TYPES.LEASE_OUT:
                        case TYPES.CANCEL_LEASING:
                            return this.asset.id === WavesApp.defaultAssets.WAVES;
                        case TYPES.ISSUE:
                        case TYPES.REISSUE:
                        case TYPES.BURN:
                            return (tx.assetId || tx.amount && tx.amount.asset.id) === this.asset.id;
                        case TYPES.SPONSORSHIP_START:
                        case TYPES.SPONSORSHIP_STOP:
                            return tx.assetId === this.asset.id;
                        case TYPES.SPONSORSHIP_FEE:
                            return this.asset.id === tx.feeAssetId;
                        default:
                            return false;
                    }
                });
            }

            /**
             * @return {*}
             * @private
             */
            _getCircleGraphData() {
                return waves.node.assets.balance(this.asset.id);
            }

            /**
             * @param available
             * @param leasedOut
             * @param inOrders
             * @private
             */
            _setCircleGraphData({ available, leasedOut, inOrders }) {
                this.circleChartData = [
                    { id: 'available', value: available },
                    { id: 'leased', value: leasedOut },
                    { id: 'inOrders', value: inOrders }
                ];
                this.totalBalance = available.add(leasedOut).add(inOrders);
                $scope.$digest();
            }

            static _getTxList() {
                return waves.node.transactions.list(100);
            }

        }

        return new AssetInfoCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope', 'user', 'createPoll', 'utils', 'waves'];

    angular.module('app.ui').controller('AssetInfoCtrl', controller);
})();
