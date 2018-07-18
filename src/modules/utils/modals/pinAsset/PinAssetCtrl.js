const ds = require('data-service');
const R = require('ramda');

(function () {
    'use strict';

    const HIDDEN_ASSETS = WavesApp.ALWAYS_PINNED_ASSETS;

    /**
     *
     * @param Base
     * @param $scope
     * @param {ExplorerLinks} explorerLinks
     * @param {Waves} waves
     * @param {IPollCreate} PromiseControl
     * @param $mdDialog
     * @return {PinAssetCtrl}
     */
    const controller = function (Base, $scope, waves, PromiseControl, $mdDialog) {

        class PinAssetCtrl extends Base {

            constructor() {
                super($scope);
                /**
                 * @type {string}
                 */
                this.search = '';
                /**
                 * @type {boolean}
                 */
                this.withScam = null;
                /**
                 * @type {boolean}
                 */
                this.loading = false;
                /**
                 * @type {boolean}
                 */
                this.isListOpen = false;
                /**
                 * @type {Array<Asset>}
                 */
                this.pinnedAssetNewList = [];
                /**
                 * @type {Object}
                 */
                this.selectedHash = {};

                this.syncSettings({
                    pinnedAssetIdList: 'pinnedAssetIdList',
                    withScam: 'withScam'
                });

                this.observe('search', this._fillList);
                this.loadPromise = this._getAvilableAssets();
                this._fillList();

                $scope.$watch('$ctrl.pinnedAssetNewList', () => this.checkChecked(), true);
            }

            /**
             * @param {Asset} asset
             * @return {boolean}
             * @private
             * @static
             */
            static _isScam(asset) {
                return !WavesApp.scam[asset.id];
            }

            /**
             * return {void}
             */
            toggleList() {
                this.isListOpen = !this.isListOpen;
            }

            /**
             * return {void}
             */
            checkChecked() {
                this.selected = 0;
                this.pinnedAssetNewList.forEach(asset => {
                    if (asset.pined) {
                        this.selectedHash[asset.id] = null;
                    } else {
                        delete this.selectedHash[asset.id];
                    }
                });
                this.selected = Object.keys(this.selectedHash).length;
            }

            /**
             * return {void}
             */
            onSubmit() {
                this.pinnedAssetIdList = R.uniq([...this.pinnedAssetIdList, ...Object.keys(this.selectedHash)]);
                $mdDialog.hide({ selected: this.selected.length });
            }

            /**
             * @return {Promise<Array<Asset>>}
             * @private
             */
            async _getAvilableAssets() {
                const myAssets = await ds.dataManager.getBalances();
                const defaultAssets = await waves.node.assets.getAsset(Object.values(WavesApp.defaultAssets));
                return R.uniqBy(R.prop('id'), [...defaultAssets, ...myAssets.map(x => x.asset)]).map((asset) => {
                    const pined = this.pinnedAssetIdList.includes(asset.id);
                    return { ...asset, pined };
                });
            }

            /**
             * @return {Promise<void>}
             * @private
             */
            async _fillList() {
                this.loading = true;
                const assetsList = this._filterAndSort(await this.loadPromise);
                const searchList = this._filterAndSort(await this._searchByApi());
                this.pinnedAssetNewList = R.uniqBy(R.prop('id'), [...assetsList, ...searchList]);
                $scope.$digest();
            }

            /**
             * @param {Array<Asset>} assetsList
             * @return {Array<Asset>}
             * @private
             */
            _filterAndSort(assetsList) {
                const filteredList = [];

                for (const asset of assetsList) {
                    if (this.pinnedAssetIdList.includes(asset.id)) {
                        continue;
                    }

                    if (HIDDEN_ASSETS.includes(asset.id)) {
                        continue;
                    }

                    if (this.withScam && PinAssetCtrl._isScam(asset)) {
                        continue;
                    }

                    if (this._isInSearch(asset)) {
                        filteredList.push(asset);
                    }
                }

                return filteredList;
            }

            /**
             * @return {Promise<Array<Asset>>}
             * @private
             */
            _searchByApi() {
                if (!this.search || !this.search.trim().length) {
                    return [];
                }

                if (this._searchPromise) {
                    this._searchPromise.drop();
                }

                this._searchPromise = new PromiseControl(waves.node.assets.search(this.search.trim()));

                return this._searchPromise.then(
                    list => list,
                    () => []
                );
            }

            /**
             * @param {Asset} asset
             * @return {boolean}
             * @private
             */
            _isInSearch(asset) {
                const search = this.search.toUpperCase().trim();

                if (!search || !this.search.length) {
                    return true;
                }
                return `${asset.id} ${asset.name} ${asset.ticker}`.toUpperCase().includes(search);
            }

        }

        return new PinAssetCtrl();
    };

    controller.$inject = ['Base', '$scope', 'waves', 'PromiseControl', '$mdDialog'];
    angular.module('app.utils').controller('PinAssetCtrl', controller);
})();
