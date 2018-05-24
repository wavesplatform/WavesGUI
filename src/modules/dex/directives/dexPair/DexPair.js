(function () {
    'use strict';

    /**
     * @param Base
     * @param {JQuery} $element
     * @param {TimeLine} timeLine
     * @return {DexPair}
     */
    const controller = function (Base, $element, timeLine) {

        class DexPair extends Base {

            constructor() {
                super();

                /**
                 * @type {string}
                 */
                this.assetId = '';

                /**
                 * @type {string}
                 */
                this.baseAssetId = '';

                /**
                 * @type {PromiseControl}
                 * @private
                 */
                this._requestTimer = null;
            }

            $postLink() {
                this.observe('baseAssetId', this._getPairAndSetTemplate);
                this._getPairAndSetTemplate();
            }

            /**
             * @private
             */
            _getPairAndSetTemplate() {
                if (this._requestTimer) {
                    timeLine.cancel(this._requestTimer);
                }
                if (this.assetId && this.baseAssetId) {
                    Waves.AssetPair.get(this.assetId, this.baseAssetId)
                        .then((pair) => {
                            this._addTemplate(`${pair.amountAsset.displayName} / ${pair.priceAsset.displayName}`);
                        }, () => {
                            this._requestTimer = timeLine.timeout(() => this._getPairAndSetTemplate(), 1000);
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

    controller.$inject = ['Base', '$element', 'timeLine'];

    angular.module('app.dex').component('wDexPair', {
        bindings: {
            assetId: '@',
            baseAssetId: '<'
        },
        transclude: false,
        controller
    });
})();
