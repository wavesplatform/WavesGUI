(function () {
    'use strict';

    function controller(Base, matcher) {

        const { Money } = require('@waves/data-entities');

        class DexWatchlistSelect extends Base {

            constructor() {
                super();
                this.watchListVisible = false;
                this._assetPair = null;
                this.pairInfo = null;

                this.syncSettings({
                    _assetIdPair: 'dex.assetIdPair'
                });
                this._onChangeAssets();
                this.observe('_assetIdPair', this._onChangeAssets);
            }

            /**
             * @private
             */
            _onChangeAssets() {
                this._getPair().then(pair => {
                    ds.api.pairs.info(matcher.currentMatcherAddress, [pair]).then(([pairInfo]) => {
                        const volume = pairInfo.volume || new Money(0, pairInfo.priceAsset);
                        this.pairInfo = {
                            ...pairInfo,
                            volumeBigNum: volume.getTokens()
                        };
                    });
                });
                this.watchListVisible = false;
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

        }

        return new DexWatchlistSelect();
    }

    controller.$inject = ['Base', 'matcher'];

    angular.module('app.dex').component('wDexWatchlistSelect', {
        templateUrl: 'modules/dex/directives/dexWatchlistSelect/dexWatchlistSelect.html',
        controller
    });
})();
