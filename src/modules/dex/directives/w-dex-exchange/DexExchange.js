(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @param {JQuery} $element
     * @param {app.utils} utils
     * @param {TimeLine} timeLine
     * @returns {DexExchange}
     */
    const controller = function (Base, waves, $element, utils, timeLine) {

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
                this._requestTimer = null;

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

                if (this._requestTimer) {
                    timeLine.cancel(this._requestTimer);
                }

                ds.api.assets.getAssetPair(this.baseAssetId, this.assetId)
                    .then((pair) => {
                        return Promise.all([
                            ds.moneyFromTokens('1', pair.amountAsset),
                            waves.utils.getRateApi(pair.amountAsset, pair.priceAsset)
                        ])
                            .then(([money, api]) => {
                                const price = api.exchange(money.getTokens());
                                return ds.moneyFromTokens(price, pair.priceAsset)
                                    .then((price) => {
                                        const precision = pair.priceAsset.precision;
                                        const num = price ? price.getTokens() : new BigNumber(0);
                                        $element.html(price ? utils.getNiceNumberTemplate(num, precision, true) : '');
                                    });
                            });
                    })
                    .catch(() => {
                        this._requestTimer = timeLine.timeout(() => this._onChangePair(), 1000);
                    });
            }

        }

        return new DexExchange();
    };

    controller.$inject = ['Base', 'waves', '$element', 'utils', 'timeLine'];

    angular.module('app.dex').component('wDexExchange', {
        bindings: {
            baseAssetId: '<',
            assetId: '@'
        },
        controller
    });

})();
