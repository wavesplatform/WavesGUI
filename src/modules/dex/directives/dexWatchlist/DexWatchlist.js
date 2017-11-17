(function () {
    'use strict';

    /**
     * @param Base
     * @param {AssetsService} assetsService
     * @param {app.utils} utils
     * @returns {DexWachlist}
     */
    const controller = function (Base, assetsService, utils) {

        const TOP_ASSTS_LIST = [
            WavesApp.defaultAssets.WAVES,
            WavesApp.defaultAssets.BTC,
            'HzfaJp8YQWLvQG4FkUxq2Q7iYWMYQ2k8UF89vVJAjWPj',
            'ABFYQjwDHSct6rNk59k3snoZfAqNHVZdHz4VGJe2oCV5',
            '474jTeYx2r2Va35794tCScAXWJG9hU2HcgxzMowaZUnu',
            'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU',
            'DHgwrRvVyqJsepd32YbBqUeDH4GJ1N984X8QoekjgH8J',
            '4uK8i4ThRGbehENwa6MxyLtxAjAo1Rj9fduborGExarC',
            'HZk1mbfuJpmxU1Fs4AX5MWLVYtctsNcg6e2C6VKqK8zk',
            'GdnNbe6E3txF63gv3rxhpfxytTJtG7ZYyHAvWWrrEbK5',
            'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck',
            'K5JcgN8UdwNdh5sbdAuPMm5XEd5aFvoXaC3iHsHVz1d',
            '725Yv9oceWsB4GsYwyy4A52kEwyVrL5avubkeChSnL46',
            '8t8DMJFQu5GEhvAetiA8aHa3yPjxLj54sBnZsjnJ5dsw',
            '4eT6R8R2XuTcBuTHiXVQsh2dN2mg3c2Qnp95EWBNHygg',
            'BrjUWjndUanm5VsJkbUip8VRYy6LWJePtxya3FNv4TQa',
            '3SdrmU1GGZRiZz12MrMcfUz4JksTzvcU25cLFXpZy1qz',
            'FLbGXzrpqkvucZqsHDcNxePTkh2ChmEi4GdBfDRRJVof',
            '5ZPuAVxAwYvptbCgSVKdTzeud9dhbZ7vvxHVnZUoxf4h',
            'zMFqXuoyrn5w17PFurTqxB7GsS71fp9dfk6XFwxbPCy',
            'APz41KyoKuBBh8t3oZjqvhbbsg6f63tpZM5Ck5LYx6h'
        ];

        const assetsList = utils.whenAll(TOP_ASSTS_LIST.map(assetsService.getAssetInfo));

        class DexWatchlist extends Base {

            constructor() {
                super();
                this.watchlist = null;
                /**
                 * @type {string}
                 * @private
                 */
                this._savePath = null;
                /**
                 * @type {string}
                 * @private
                 */
                this._baseAssetId = null;
                /**
                 * @type {DexBlock}
                 * @private
                 */
                this._parent = null;
            }

            $postLink() {
                if (!this._savePath || !this._parent) {
                    throw new Error('Wrong directive params!');
                }

                this.observe('_baseAssetId', this._onChangeBaseAsset);
                this.syncSettings({ _baseAssetId: this._savePath });
            }

            _onChangeBaseAsset() {
                assetsService.getMoney('1', this._baseAssetId).then((money) => {
                    this.baseMoney = money;
                });
                assetsList.then((asstList) => {
                    this.watchlist = asstList.filter(tsUtils.notContains({ id: this._baseAssetId }));
                });
            }

        }

        return new DexWatchlist();
    };

    controller.$inject = ['Base', 'assetsService', 'utils'];

    angular.module('app.dex').component('wDexWatchlist', {
        bindings: {
            _savePath: '@assetSavePath'
        },
        require: {
            _parent: '^wDexBlock'
        },
        templateUrl: 'modules/dex/directives/dexWatchlist/watchlist.html',
        transclude: false,
        controller
    });
})();
