(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {ng.IScope} $scope
     * @param {GatewayService} gatewayService
     * @param {User} user
     * @param {Waves} waves
     * @return {ReceiveCtrl}
     */
    const controller = function (Base, $scope, gatewayService, user, waves) {

        class ReceiveCtrl extends Base {

            /**
             * @type {string}
             */
            activeTab = '';

            /**
             * @type { {[k: string]: boolean} }
             */
            tabs = {
                cryptocurrency: false,
                invoice: false,
                card: false,
                bank: false
            }

            /**
             * @type {boolean}
             */
            isSingleAsset;

            /**
             * @type {Array}
             */
            cryptocurrencies;

            /**
             * @type {Array}
             */
            invoicables;

            /**
             * @type {Array}
             */
            purchasablesByCards;

            /**
             * @type {Array}
             */
            fiats;

            constructor({ asset }) {
                super($scope);

                /**
                 * @type {Asset}
                 */
                this.asset = asset;

                if (this.asset) {
                    this.isSingleAsset = true;
                    this.initForSingleAsset();
                } else {
                    this.isSingleAsset = false;
                    this.initForAllAssets();
                }
            }

            initForSingleAsset() {
                if (gatewayService.hasSupportOf(this.asset, 'deposit')) {
                    this.enableTab('cryptocurrency');
                }

                this.enableTab('invoice');

                if (gatewayService.hasSupportOf(this.asset, 'card')) {
                    this.enableTab('card');
                }

                if (gatewayService.hasSupportOf(this.asset, 'sepa')) {
                    this.enableTab('bank');
                }
            }

            initForAllAssets() {
                const cryptocurrenciesRequests = this.getExtendedAssets(gatewayService.getCryptocurrencies());
                const cryptocurrenciesRequest = Promise.all(cryptocurrenciesRequests).then((results) => {
                    this.cryptocurrencies = results;
                });

                const invoicesRequest = waves.node.assets.userBalances().then((results) => {
                    this.invoicables = results
                        .filter((balance) => !user.scam[balance.asset.id])
                        .map((balance) => balance.asset);
                });

                const cardsRequests = this.getExtendedAssets(gatewayService.getPurchasableWithCards());
                const cardsRequest = Promise.all(cardsRequests).then((results) => {
                    this.purchasablesByCards = results;
                });

                const fiatsRequests = this.getExtendedAssets(gatewayService.getFiats());
                const fiatsRequest = Promise.all(fiatsRequests).then((results) => {
                    this.fiats = results;
                });

                Promise.all([
                    cryptocurrenciesRequest,
                    invoicesRequest,
                    cardsRequest,
                    fiatsRequest
                ]).then(() => {
                    this.updateAssetBy(this.cryptocurrencies[0].id);

                    this.enableTab('cryptocurrency');
                    this.enableTab('invoice');
                    this.enableTab('card');
                    this.enableTab('bank');

                    this.initForSingleAsset();
                });
            }

            /**
             * @param {Object} assetsIds
             */
            getExtendedAssets(assetsIds) {
                return (
                    Object
                        .keys(assetsIds)
                        .map(waves.node.assets.getAsset)
                );
            }

            /**
             * @param {string} id
             */
            updateAssetBy(id) {
                this.asset = (
                    this.cryptocurrencies.find((cryptocurrency) => cryptocurrency.id === id) ||
                    this.invoicables.find((invoicable) => invoicable.id === id) ||
                    this.purchasablesByCards.find((purchasableByCards) => purchasableByCards.id === id) ||
                    this.fiats.find((fiat) => fiat.id === id)
                );
            }

            /**
             * @param {'cryptocurrency' | 'invoice' | 'card' | 'bank'} name
             */
            enableTab(name) {
                this.tabs[name] = true;
            }

        }

        return new ReceiveCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope', 'gatewayService', 'user', 'waves'];

    angular.module('app.utils').controller('ReceiveCtrl', controller);
})();
