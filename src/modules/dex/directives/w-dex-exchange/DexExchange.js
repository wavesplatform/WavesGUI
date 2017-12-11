(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @param {JQuery} $element
     * @param {app.utils} utils
     * @returns {DexExchange}
     */
    const controller = function (Base, waves, $element, utils) {

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
                                        const precision = pair.priceAsset.precision;
                                        const num = price ? price.getTokens() : new BigNumber(0);
                                        $element.html(price ? utils.getNiceNumberTemplate(num, precision, true) : '');
                                    });
                            });
                    });
            }

        }

        return new DexExchange();
    };

    controller.$inject = ['Base', 'waves', '$element', 'utils'];

    angular.module('app.dex').component('wDexExchange', {
        bindings: {
            baseAssetId: '<',
            assetId: '@'
        },
        controller
    });

})();
