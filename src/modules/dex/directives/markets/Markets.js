(function () {
    'use strict';

    /**
     * @param {User} user
     * @param {*} utils
     * @param {AssetsService} assetsService
     * @param {Base} Base
     * @return {Markets}
     */
    const controller = function (user, utils, assetsService, Base) {

        class Markets extends Base {

            constructor() {
                super();
                /**
                 * @type {string}
                 */
                this.wavesId = WavesApp.defaultAssets.WAVES;
                /**
                 * @type {string}
                 */
                this.bitcoinId = WavesApp.defaultAssets.BTC;
                /**
                 * @type {Array<string>}
                 */
                this.favoriteIds = null;
                /**
                 * @type {Array<IAssetInfo>}
                 */
                this.favorites = null;
                /**
                 * @type {IAssetInfo}
                 */
                this.activeAsset = null;
                /**
                 * @type {string}
                 */
                this.activeAssetId = null;
                /**
                 * @type {string}
                 */
                this.amountAssetId = null;
                /**
                 * @type {string}
                 */
                this.priceAssetId = null;

                this.syncSettings([
                    'dex.directives.markets.activeAssetId',
                    'dex.directives.markets.favoriteIds'
                ]);

                this.observe('favoriteIds', this._onChangeFavoriteIds);
                this.observe('activeAssetId', this._onChangeActiveAssetId);
                this.observe('amountAssetId', this._onChangeAmountAssetId);
            }

            /**
             * @private
             */
            _onChangeFavoriteIds() {
                utils.when(Promise.all(this.favoriteIds.map(assetsService.getAssetInfo)))
                    .then((favorites) => {
                        this.favorites = favorites;
                    });
            }

            /**
             * @private
             */
            _onChangeActiveAssetId() {
                assetsService.getAssetInfo(this.activeAssetId)
                    .then((asset) => {
                        this.activeAsset = asset;
                    });
            }

            /**
             * @private
             */
            _onChangeAmountAssetId() {
                if (this.amountAssetId === this.priceAssetId) {
                    this.priceAssetId = this.favoriteIds.filter(tsUtils.notContains(this.amountAssetId))[0];
                }
            }

        }

        return new Markets();
    };

    controller.$inject = ['user', 'utils', 'assetsService', 'Base'];

    angular.module('app.dex')
        .component('wDexMarkets', {
            bindings: {
                amountAssetId: '=',
                priceAssetId: '='
            },
            templateUrl: 'modules/dex/directives/markets/markets.html',
            controller
        });
})();
