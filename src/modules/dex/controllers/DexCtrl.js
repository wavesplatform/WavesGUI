(function () {
    'use strict';

    /**
     * @param {AssetsService} assetsService
     * @param utils
     * @param {User} user
     * @return {DexCtrl}
     */
    const controller = function (assetsService, utils, user, Base, $element) {

        class DexCtrl extends Base {

            constructor() {
                super();

                this._amountAssetId = null;
                this._priceAssetId = null;
                this._leftHidden = false;
                this._rightHidden = false;

                this.syncSettings({
                    _amountAssetId: 'dex._amountAssetId',
                    _priceAssetId: 'dex._priceAssetId',
                    _leftHidden: 'dex.layout.leftColumnState',
                    _rightHidden: 'dex.layout.rightColumnState',
                    collapseTradeHistory: 'dex.layout.tradeHistory.collapsed'
                });

                this.observe(['_leftHidden', '_rightHidden'], this._onChangeProperty);
            }

            // @TODO refactor
            // hide and show graph to force its resize
            toggleColumn(column) {
                this[`_${column}Hidden`] = !this[`_${column}Hidden`];
            }

            _onChangeProperty() {
                const $graphWrapper = $element.find('.graph-wrapper');
                $graphWrapper.hide();
                setTimeout(() => $graphWrapper.show(), 100);
            }

        }

        return new DexCtrl();
    };


    controller.$inject = ['assetsService', 'utils', 'user', 'Base', '$element'];

    angular.module('app.dex')
        .controller('DexCtrl', controller);
})();
