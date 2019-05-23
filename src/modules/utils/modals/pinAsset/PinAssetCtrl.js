const ds = require('data-service');
const R = require('ramda');

(function () {
    'use strict';

    const HIDDEN_ASSETS = WavesApp.ALWAYS_PINNED_ASSETS;

    /**
     *
     * @param Base
     * @param $scope
     * @param {Waves} waves
     * @param {IPollCreate} PromiseControl
     * @param $mdDialog
     * @param {User} user
     * @return {PinAssetCtrl}
     */
    const controller = function (Base, $scope, waves, PromiseControl, $mdDialog, user) {

        const analytics = require('@waves/event-sender');

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
                this.dontShowSpam = null;
                /**
                 * @type {Array<Asset>}
                 */
                this.pinnedAssetNewList = [];
                /**
                 * @type {Array<string>}
                 */
                this.pinnedAssetIdList = [];
                /**
                 * @type {Array<string>}
                 */
                this.spam = [];
                /**
                 * @type {Object}
                 */
                this.selectedHash = {};

                this.syncSettings({
                    pinnedAssetIdList: 'pinnedAssetIdList',
                    spam: 'wallet.portfolio.spam',
                    withScam: 'withScam',
                    dontShowSpam: 'dontShowSpam'
                });

                this.observe('search', this._fillList);
                this.loadPromise = this._getAvilableAssets();
                this._fillList();

                $scope.$watch('$ctrl.pinnedAssetNewList', () => this.checkChecked(), true);
            }

            /**
             * return {void}
             */
            checkChecked() {
                this.selected = 0;
                this.pinnedAssetNewList.forEach(asset => {
                    if (asset.pinned) {
                        this.selectedHash[asset.id] = true;
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
                const selectedAssets = Object.keys(this.selectedHash);
                analytics.send({
                    name: 'Wallet Assets Pin',
                    params: { Currency: selectedAssets },
                    target: 'ui'
                });
                this.pinnedAssetIdList = R.uniq([...this.pinnedAssetIdList, ...selectedAssets]);
                this.spam = this.spam.filter((spamId) => !this.pinnedAssetIdList.includes(spamId));
                $mdDialog.hide({ selected: this.selected.length });
            }

            /**
             * @param {Asset} asset
             * @return {boolean}
             * @private
             */
            _isSpam(asset) {
                return (this.spam || []).includes(asset.id);
            }

            /**
             * @return {Promise<Array<Asset>>}
             * @private
             */
            async _getAvilableAssets() {
                const myAssets = await ds.dataManager.getBalances();
                const defaultAssets = await waves.node.assets.getAsset(Object.values(WavesApp.defaultAssets));
                return R.uniqBy(R.prop('id'), [...defaultAssets, ...myAssets.map(x => x.asset)]).map((asset) => {
                    const pinned = this.pinnedAssetIdList.includes(asset.id);
                    return { ...asset, pinned };
                });
            }

            /**
             * @return {Promise<void>}
             * @private
             */
            async _fillList() {
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

                    if (!this.withScam && (PinAssetCtrl._isScam(asset) || this._isSpam(asset))) {
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

            /**
             * @param {Asset} asset
             * @return {boolean}
             * @private
             * @static
             */
            static _isScam(asset) {
                return (user.scam || {})[asset.id];
            }

        }

        return new PinAssetCtrl();
    };

    controller.$inject = ['Base', '$scope', 'waves', 'PromiseControl', '$mdDialog', 'user'];
    angular.module('app.utils').controller('PinAssetCtrl', controller);
})();
