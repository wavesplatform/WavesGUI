(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {ng.IScope} $scope
     * @param {GatewayService} gatewayService
     * @param {User} user
     * @return {ReceiveCard}
     */
    const controller = function (Base, $scope, gatewayService, user) {

        class ReceiveCard extends Base {

            /**
             * @type {Asset}
             */
            asset = null;

            /**
             * @type {Array}
             */
            purchasablesByCards = undefined;

            /**
             * @type {boolean}
             */
            isSingleAsset;

            /**
             * @type {Function}
             */
            onAssetChange;

            /**
             * @type {number}
             */
            step = 0;

            /**
             * @type {string}
             */
            indacoinLink = '#';

            /**
             * @type {Array}
             */
            cardFiatList = gatewayService.getDefaultCardFiatList();

            /**
             * @type {number}
             */
            approximateAmount = 0;

            /**
             * @type {number}
             */
            chosenCurrencyIndex = 0;

            /**
             * @type {string}
             */
            chosenAssetId = null;

            /**
             * @type {Object}
             */
            cardPayment = null;

            /**
             * @type {boolean}
             */
            showIndacoinRedirectionDescription = false;

            constructor() {
                super();

                this.observe('chosenAssetId', ({ value: id }) => this.onAssetChange({ id }));

                this.observe(['chosenCurrencyIndex', 'cardPayment'], this._updateAmountAndLink);

                this.observe(['asset', 'purchasablesByCards'], this._updateDetails);
            }

            confirmIndacoin() {
                this.showIndacoinRedirectionDescription = true;
                this.nextStep();
            }

            nextStep() {
                this.step += 1;
            }

            /**
             * @private
             */
            _updateAmountAndLink() {
                if (!this.cardPayment) {
                    return null;
                }

                this._updateApproximateAmount();
                this._updateIndacoinLink();
            }

            /**
             * @private
             */
            _updateDetails() {
                if (!this.asset || !this.purchasablesByCards || !this._isPurchasableByCard(this.asset)) {
                    return;
                }

                this._updateCardPayment().then(cardPayment => {
                    this.cardPayment = cardPayment;
                }).then(
                    () => this._updateCardFiatList()
                ).then(cardFiatList => {
                    this.cardFiatList = cardFiatList;

                    this._updateAmountAndLink();
                    $scope.$apply();
                });
            }

            /**
             * @private
             */
            _updateCardPayment() {
                return ds.moneyFromTokens(
                    this.cardFiatList[0].min,
                    this.cardFiatList[0].assetId
                );
            }

            /**
             * @private
             */
            _updateCardFiatList() {
                return gatewayService.getCardFiatWithLimits(
                    this.asset,
                    user.address,
                    gatewayService.getDefaultCardFiatList()
                );
            }

            /**
             * @private
             */
            _updateApproximateAmount() {
                this.approximateAmount = new ds.wavesDataEntities.Money(0, this.asset);

                gatewayService.getCardApproximateCryptoAmount(
                    this.asset,
                    this.cardFiatList[this.chosenCurrencyIndex].fiatCode,
                    user.address,
                    this._tokenizeCardPayment()
                ).then(approximateAmount => {
                    const coins = new BigNumber(approximateAmount).times(Math.pow(10, this.asset.precision));

                    this.approximateAmount = new ds.wavesDataEntities.Money(coins.dp(0), this.asset);
                    $scope.$apply();
                });
            }

            /**
             * @private
             */
            _updateIndacoinLink() {
                this.indacoinLink = gatewayService.getCardBuyLink(
                    this.asset,
                    this.cardFiatList[this.chosenCurrencyIndex].fiatCode,
                    user.address,
                    this._tokenizeCardPayment()
                );
            }

            /**
             * @param {Asset} asset
             * @private
             */
            _isPurchasableByCard(asset) {
                return this.purchasablesByCards.find((purchasable) => purchasable.id === asset.id);
            }

            /**
             * @private
             */
            _tokenizeCardPayment() {
                return (this.cardPayment && this.cardPayment.toTokens());
            }

        }

        return new ReceiveCard();
    };

    controller.$inject = ['Base', '$scope', 'gatewayService', 'user'];

    angular.module('app.utils').component('wReceiveCard', {
        controller,
        bindings: {
            asset: '<',
            purchasablesByCards: '<',
            isSingleAsset: '<',
            onAssetChange: '&'
        },
        templateUrl: 'modules/utils/modals/receive/receiveCard/receive-card.html'
    });
})();
