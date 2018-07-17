(function () {
    'use strict';

    const ds = require('data-service');

    /**
     * @param {Base} Base
     * @param {JQuery} $element
     * @param {$state} $state
     * @param {$location} $location
     * @param {User} user
     * @param {$rootScope.Scope} $scope
     * @return {DexCtrl}
     */
    const controller = function (Base, $element, $state, $location, user, $scope) {

        class DexCtrl extends Base {

            constructor() {
                super();
                /**
                 * @type {boolean}
                 */
                this.ready = false;
                /**
                 * @type {boolean}
                 */
                this.isLogined = !!user.address;
                /**
                 * @type {boolean}
                 * @private
                 */
                this._leftHidden = false;
                /**
                 * @type {boolean}
                 * @private
                 */
                this._rightHidden = false;
                /**
                 * @type {{price: string, amount: string}}
                 * @private
                 */
                this._assetIdPair = null;


                this.syncSettings({
                    tab: 'dex.layout.bottomleft.tab',
                    _leftHidden: 'dex.layout.leftColumnState',
                    _rightHidden: 'dex.layout.rightColumnState',
                    _assetIdPair: 'dex.assetIdPair'
                });

                if (!this.isLogined) {
                    this.tab = 'tradeHistory';
                }

                this.observe('_assetIdPair', this._onChangePair);
                this.observe(['_leftHidden', '_rightHidden'], this._onChangeProperty);

                this._initializePair().then(() => {
                    this.ready = true;
                    $scope.$apply();
                });
            }

            // hide and show graph to force its resize
            toggleColumn(column) {
                this[`_${column}Hidden`] = !this[`_${column}Hidden`];
            }

            async _onChangePair() {
                const pair = await this._getPair();
                $location.search('assetId2', pair.amountAsset.id);
                $location.search('assetId1', pair.priceAsset.id);
            }

            _initializePair() {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        const urlPair = this._getPairFromState();
                        if (urlPair) {
                            return this._getPair(urlPair)
                                .catch(() => this._getPair({
                                    amount: WavesApp.defaultAssets.WAVES,
                                    price: WavesApp.defaultAssets.BTC
                                }))
                                .then((pair) => {
                                    const activeTab = user.getSetting('dex.watchlist.activeTab');

                                    if (activeTab !== 'all' &&
                                        activeTab !== pair.amountAsset.id &&
                                        activeTab !== pair.priceAsset.id) {
                                        user.setSetting('dex.watchlist.activeTab', 'all');
                                    }

                                    this._assetIdPair = {
                                        amount: pair.amountAsset.id,
                                        price: pair.priceAsset.id
                                    };
                                })
                                .then(resolve);
                        } else {
                            this._onChangePair();
                            resolve();
                        }
                    }, 200);
                });
            }

            /**
             * @private
             */
            _getPair(pair = this._assetIdPair) {
                if (pair) {
                    return ds.api.pairs.get(pair.amount, pair.price);
                } else {
                    return ds.api.pairs.get(WavesApp.defaultAssets.WAVES, WavesApp.defaultAssets.BTC);
                }
            }

            _getPairFromState() {
                if (!($state.params.assetId1 && $state.params.assetId2)) {
                    return null;
                }

                return {
                    amount: $state.params.assetId1,
                    price: $state.params.assetId2
                };
            }

            /**
             * @private
             */
            _onChangeProperty() {
                const $graphWrapper = $element.find('.graph-wrapper');
                $graphWrapper.hide();
                setTimeout(() => $graphWrapper.show(), 100);
            }

        }

        return new DexCtrl();
    };


    controller.$inject = ['Base', '$element', '$state', '$location', 'user', '$scope'];

    angular.module('app.dex')
        .controller('DexCtrl', controller);
})();
