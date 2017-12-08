(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @param {JQuery} $element
     * @returns {DexExchange}
     */
    const controller = function (Base, waves, $element) {

        class DexExchange extends Base {

            constructor() {
                super();

                /**
                 * @type {string}
                 */
                this.baseAssetId = null;
                /**
                 * @type {string}
                 */
                this.assetId = null;

                this.observe('baseAssetId', this._onChangePair);
            }

            $postLink() {
                this._onChangePair();
            }

            /**
             * @private
             */
            _onChangePair() {
                if (!this.baseAssetId || !this.assetId || this.baseAssetId === this.assetId) {
                    return null;
                }

                Waves.AssetPair.get(this.baseAssetId, this.assetId)
                    .then((pair) => {
                        return Promise.all([
                            Waves.Money.fromTokens('1', pair.amountAsset),
                            waves.utils.getRateApi(pair.amountAsset, pair.priceAsset)
                        ])
                            .then(([money, api]) => {
                                const price = api.exchange(money.getTokens());
                                Waves.Money.fromTokens(price, pair.priceAsset)
                                    .then((price) => {
                                        $element.html(price ? price.toFormat() : '');
                                    });
                            });
                    });
            }

        }

        return new DexExchange();
    };

    controller.$inject = ['Base', 'waves', '$element'];

    angular.module('app.dex').component('wDexExchange', {
        bindings: {
            baseAssetId: '<',
            assetId: '@'
        },
        controller
    });

})();
