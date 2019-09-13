(function () {
    'use strict';

    function controller(Base) {

        class Controller extends Base {

            constructor() {
                super();
                this.mobileTab = 'Charts';
                this.mobileOrdersTab = 'myOpenOrders';
                this.mobileHistoryTab = 'orderBook';
                this.watchListVisible = false;
                this._assetPair = null;

                this.syncSettings({
                    _assetIdPair: 'dex.assetIdPair'
                });
                this.observe('_assetIdPair', this._onChangeAssets);
            }

            async _onChangeAssets() {
                const pair = await this._getPair();
                return pair;
            }

            /**
             * @private
             */
            _getPair(pair = this._assetIdPair) {
                if (pair) {
                    return ds.api.pairs.get(pair.amount, pair.price);
                } else {
                    return ds.api.pairs.get(WavesApp.defaultAssets.WAVES, WavesApp.defaultAssets.BTC);
                }
            }

            setHovered() {
                this.isHovered = true;
            }

            setNotHovered() {
                this.isHovered = false;
            }

        }


        return new Controller();
    }

    controller.$inject = ['Base'];

    angular.module('app.dex')
        .component('wMobileLayout', {
            templateUrl: 'modules/dex/directives/mobileLayout/mobileLayout.html',
            controller
        });
})();
