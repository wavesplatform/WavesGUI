(function () {
    'use strict';

    /**
     * @param Base
     * @param {JQuery} $element
     * @param {IPollCreate} createPoll
     * @param {app.utils} utils
     * @return {DexWatchListPrice}
     */
    const controller = function (Base, $element, createPoll, utils) {

        class DexWatchListPrice extends Base {

            constructor() {
                super();

                /**
                 * @type {AssetPair}
                 */
                this.pair = null;
            }

            $postLink() {
                createPoll(this, this._getPrice, this._setPrice, 1000 * 60);
            }

            _getPrice() {
                return ds.api.transactions.getExchangeTxList({
                    amountAsset: this.pair.amountAsset,
                    priceAsset: this.pair.priceAsset,
                    limit: 1,
                    timeStart: 0 // TODO Remove after update data services
                }).then((exchangeTx) => {
                    return exchangeTx[0] && exchangeTx[0].price || null;
                });
            }

            _setPrice(price) {
                $element.html(price && utils.getNiceNumberTemplate(price.getTokens(), price.asset.precision) || '—');
            }

        }

        return new DexWatchListPrice();
    };

    controller.$inject = ['Base', '$element', 'createPoll', 'utils'];

    angular.module('app.dex').component('wDexWatchListPrice', {
        bindings: {
            pair: '<'
        },
        transclude: false,
        controller
    });
})();
