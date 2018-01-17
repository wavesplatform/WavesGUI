(function () {
    'use strict';

    /**
     * @param Base
     * @param {JQuery} $element
     * @return {DexPair}
     */
    const controller = function (Base, $element) {

        class DexPair extends Base {

            constructor() {
                super();
                /**
                 * @type {string}
                 */
                this.assetId = null;
                /**
                 * @type {string}
                 */
                this.baseAssetId = null;
            }

            $postLink() {
                if (!this.assetId) {
                    throw new Error('Has no asset id!');
                }
                this.observe('baseAssetId', this._onChangeAssetId);
                this._onChangeAssetId();
            }

            /**
             * @private
             */
            _onChangeAssetId() {
                if (this.assetId && this.baseAssetId) {
                    Waves.AssetPair.get(this.assetId, this.baseAssetId)
                        .then((pair) => {
                            const amount = pair.amountAsset.displayName;
                            const price = pair.priceAsset.displayName;
                            this._addTemplate(`${amount} / ${price}`);
                        });
                } else {
                    this._addTemplate('');
                }
            }

            /**
             * @param {string} pair
             * @private
             */
            _addTemplate(pair) {
                $element.html(pair);
                $element.attr('title', pair);
            }

        }

        return new DexPair();
    };

    controller.$inject = ['Base', '$element'];

    angular.module('app.dex').component('wDexPair', {
        bindings: {
            assetId: '@',
            baseAssetId: '<'
        },
        transclude: false,
        controller
    });
})();
