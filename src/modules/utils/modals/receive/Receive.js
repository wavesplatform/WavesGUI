(function () {
    'use strict';

    const DEFAULT_LINK = '#';
    const COINOMAT_API_ROOT = 'https://coinomat.com/api/v2/indacoin/';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {GatewayService} gatewayService
     * @param {User} user
     * @param {app.utils} utils
     * @return {ReceiveCtrl}
     */
    const controller = function (Base, $scope, gatewayService, user, utils) {

        class ReceiveCtrl extends Base {

            constructor({ address, asset }) {
                super($scope);

                /**
                 * @type {string}
                 */
                this.address = address;

                /**
                 * @type {Asset}
                 */
                this.asset = asset;

                /**
                 * @type {number}
                 */
                this.step = 0;

                /**
                 * @type {string}
                 */
                this.assetKeyName = null;

                /**
                 * @type {string}
                 */
                this.gatewayAddress = null;

                /**
                 * @type {string}
                 */
                this.listOfEligibleCountries = null;
                /**
                 * @type {string}
                 */
                this.idNowSiteUrl = null;

                /**
                 * @type {string}
                 */
                this.idNowUserLink = DEFAULT_LINK;

                /**
                 * @type {string}
                 */
                this.digiLiraUserLink = 'https://www.digilira.com/';

                /**
                 * @type {string}
                 */
                this.indacoinLink = DEFAULT_LINK;

                /**
                 * @type {boolean}
                 */
                this.showCryptocurrencyTab = false;

                /**
                 * @type {boolean}
                 */
                this.showCardTab = false;

                /**
                 * @type {boolean}
                 */
                this.showBankTab = false;


                /**
                 * @type {boolean}
                 */
                this.showIdNowRedirectionDescription = false;

                /**
                 * @type {boolean}
                 */
                this.showIndacoinRedirectionDescription = false;

                /**
                 * @type {boolean}
                 */
                this.showDigiliraRedirectionDescription = false;

                /**
                 * @type {number}
                 */
                this.chosenCurrencyIndex = 0;

                /**
                 * {{[p: string]: string}}
                 */
                this.currencies = [
                    {
                        name: 'USD',
                        fiat: 'USD',
                        min: 30,
                        max: 200
                    },
                    {
                        name: 'EUR',
                        fiat: 'EURO',
                        min: 30,
                        max: 200
                    }
                ];

                /**
                 * @type {number}
                 */
                this.cardPayment = this.currencies[this.chosenCurrencyIndex].min;

                /**
                 * @type {string}
                 */
                this.approximateAmount = '';

                this.observe(['chosenCurrencyIndex', 'cardPayment'], () => {
                    fetch(
                        `${COINOMAT_API_ROOT}rate.php?address=${
                            user.address
                        }&amount=${
                            this.cardPayment
                        }&crypto=${
                            this.asset.displayName
                        }&fiat=${
                            this.currencies[this.chosenCurrencyIndex].fiat
                        }`
                    )
                        .then(utils.onFetch)
                        .then((approximateAmount) => {
                            const coins = new BigNumber(approximateAmount).mul(Math.pow(10, asset.precision));
                            this.approximateAmount = new Waves.Money(coins.round(0), asset);
                        });

                    this.indacoinLink = `${COINOMAT_API_ROOT}buy.php?address=${
                        user.address
                    }&fiat=${
                        this.currencies[this.chosenCurrencyIndex].fiat
                    }&amount=${
                        this.cardPayment
                    }&crypto=${
                        this.asset.displayName
                    }`;
                });

                const depositDetails = gatewayService.getDepositDetails(asset, address);
                if (depositDetails) {
                    depositDetails.then((details) => {
                        this.gatewayAddress = details.address;
                    });

                    this.assetKeyName = gatewayService.getAssetKeyName(asset, 'deposit');
                    this.showCryptocurrencyTab = true;
                }

                const sepaDetails = gatewayService.getSepaDetails(asset, address);
                if (sepaDetails) {
                    sepaDetails.then((details) => {
                        this.listOfEligibleCountries = details.listOfEligibleCountries;
                        this.idNowSiteUrl = details.idNowSiteUrl;
                        this.idNowUserLink = details.idNowUserLink;
                    });
                    this.showBankTab = true;
                }

                this.showCardTab = gatewayService.getCardDetails(asset);
            }

            confirmIdNow() {
                this.showIdNowRedirectionDescription = true;
                this.increaseStep();
            }

            confirmIndacoin() {
                this.showIndacoinRedirectionDescription = true;
                this.increaseStep();
            }

            confirmDigilira() {
                this.showDigiliraRedirectionDescription = true;
                this.increaseStep();
            }

            increaseStep() {
                this.step++;
            }

            isLira() {
                return this.asset.id === WavesApp.defaultAssets.TRY;
            }

        }

        return new ReceiveCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope', 'gatewayService', 'user', 'utils'];

    angular.module('app.utils').controller('ReceiveCtrl', controller);
})();
