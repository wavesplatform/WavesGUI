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

                this.amountAssetId = null;
                this.priceAssetId = null;
				this.syncSettings({ amountAssetId: 'dex.amountAssetId', priceAssetId: 'dex.priceAssetId' });
				
				this.leftHidden = false;
				this.rightHidden = false;
			}

			// @TODO refactor
			// hide and show graph to force its resize
			toggleColumn(column) {
				const $graphWrapper = $element.find('.graph-wrapper');
				$graphWrapper.hide();
				this[`${column}Hidden`] = !this[`${column}Hidden`];
				setTimeout(() => $graphWrapper.show(), 100);
			}

        }

        return new DexCtrl();
    };


    controller.$inject = ['assetsService', 'utils', 'user', 'Base', '$element'];

    angular.module('app.dex')
        .controller('DexCtrl', controller);
})();
