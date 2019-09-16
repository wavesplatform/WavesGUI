(function () {
    'use strict';

    function controller(Base, matcher) {

        const { Money } = require('@waves/data-entities');

        class Controller extends Base {

            constructor() {
                super();
                this.mobileTab = 'Charts';
                this.mobileOrdersTab = 'myOpenOrders';
                this.mobileHistoryTab = 'orderBook';
                this.watchListVisible = false;
                this._assetPair = null;
                this.pairInfo = null;

                this.syncSettings({
                    _assetIdPair: 'dex.assetIdPair'
                });
                this._onChangeAssets();
                this.observe('_assetIdPair', this._onChangeAssets);
            }

            _onChangeAssets() {
                this._getPair()
                    .then(pair => {
                        ds.api.pairs.info(matcher.currentMatcherAddress, [pair]).then(([pairInfo]) => {
                            const volume = pairInfo.volume || new Money(0, pairInfo.priceAsset);
                            this.pairInfo = {
                                ...pairInfo,
                                volumeBigNum: volume.getTokens()
                            };
                        });
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

            setHovered() {
                this.isHovered = true;
            }

            setNotHovered() {
                this.isHovered = false;
            }

        }


        return new Controller();
    }

    controller.$inject = ['Base', 'matcher'];

    angular.module('app.dex')
        .component('wMobileLayout', {
            templateUrl: 'modules/dex/directives/mobileLayout/mobileLayout.html',
            controller
        });
})();
