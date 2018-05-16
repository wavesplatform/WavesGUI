(function () {
    'use strict';

    const DEFAULT_LINK = '#';
    const COINOMAT_API = 'https://coinomat.com/api/v2/indacoin/';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {GatewayService} gatewayService
     * @param {User} user
     * @param {app.utils} utils
     * @param {Waves} waves
     * @return {ReceiveCtrl}
     */
    const controller = function (Base, $scope, gatewayService, user, utils, waves) {

        class ReceiveCtrl extends Base {

            constructor({ address, asset }) {
                super($scope);

                this.activeTab = 'cryptocurrency';
                /**
                 * @type {string}
                 */
                this.address = address;

                /**
                 * @type {Asset}
                 */
                this.asset = asset;

                /**
                 * @type {string}
                 */
                this.chosenAssetId = '';

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
                this.listOfEligibleCountries = DEFAULT_LINK;
                /**
                 * @type {string}
                 */
                this.idNowSiteUrl = DEFAULT_LINK;

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
                this.singleAsset = true;

                /**
                 * @type {boolean}
                 */
                this.showCryptocurrencyTab = false;

                /**
                 * @type {Array}
                 */
                this.cryptocurrencies = null;

                /**
                 * @type {boolean}
                 */
                this.showInvoiceTab = false;

                /**
                 * @type {Array}
                 */
                this.invoicables = null;

                /**
                 * @type {Array}
                 */
                this.addressAndAliases = null;

                /**
                 * @type {string}
                 */
                this.chosenAlias = '';

                /**
                 * @type {Object}
                 */
                this.invoiceAmount = null;

                /**
                 * @type {string}
                 */
                this.sendLink = '';

                /**
                 * @type {boolean}
                 */
                this.showCardTab = false;

                /**
                 * @type {Array}
                 */
                this.purchasablesByCards = null;

                /**
                 * @type {boolean}
                 */
                this.showBankTab = false;

                /**
                 * @type {Array}
                 */
                this.fiats = null;

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
                        assetId: WavesApp.defaultAssets.USD,
                        fiat: 'USD',
                        min: '30',
                        max: '200'
                    },
                    {
                        name: 'EUR',
                        assetId: WavesApp.defaultAssets.EUR,
                        fiat: 'EURO',
                        min: '30',
                        max: '200'
                    }
                ];

                /**
                 * @type {Object}
                 */
                this.cardPayment = null;

                /**
                 * @type {string}
                 */
                this.approximateAmount = '';

                if (this.asset) {
                    this.initForSingleAsset();
                } else {
                    this.singleAsset = false;
                    this.initForAllAssets();
                }
            }

            initForSingleAsset() {
                this.initCryptocurrencyTab();
                this.initInvoiceTab();
                this.initCardTab();
                this.initBankTab();
            }

            initCryptocurrencyTab() {
                const depositDetails = gatewayService.getDepositDetails(this.asset, this.address);
                if (depositDetails) {
                    depositDetails.then((details) => {
                        this.gatewayAddress = details.address;

                        $scope.$digest();
                    });

                    this.assetKeyName = gatewayService.getAssetKeyName(this.asset, 'deposit');
                    this.activateCryptocurrencyTab();
                }
            }

            initInvoiceTab() {
                this.addressAndAliases = [
                    this.address,
                    ...waves.node.aliases.getAliasList()
                ];

                this.activateInvoiceTab();

                if (this.showInvoiceTab) {
                    this.setInvoiceObserver();
                }
            }

            setInvoiceObserver() {
                this.observe(['chosenAlias', 'invoiceAmount'], () => {
                    this.updateSendLink();
                });
            }

            updateSendLink() {
                const assetId = this.asset && this.asset.id;

                if (!(assetId && this.chosenAlias)) {
                    this.sendLink = '';
                    return;
                }

                const invoiceAmount = (this.invoiceAmount && this.invoiceAmount.toTokens()) || '0';

                const WAVES_URL = 'https://beta.wavesplatform.com';

                this.sendLink = `${WAVES_URL}/#send/${assetId}?recipient=${this.chosenAlias}&amount=${invoiceAmount}`;
            }

            initCardTab() {
                this.updateCardDetails();
                if (this.showCardTab) {
                    this.setCardObserver();
                }
            }

            updateCardDetails() {
                Waves.Money.fromTokens(this.currencies[0].min, this.currencies[0].assetId).then((sum) => {
                    this.cardPayment = sum;
                });

                if (gatewayService.getCardDetails(this.asset)) {
                    this.activateCardTab();
                }
            }

            setCardObserver() {
                this.observe(['chosenCurrencyIndex', 'cardPayment'], () => {
                    if (!Number(this.tokenizeCardPayment())) {
                        this.approximateAmount = new Waves.Money(0, this.asset);
                        return;
                    }

                    this.updateApproximateAmount();

                    const params = this.getCoinomatParams();
                    this.indacoinLink = (
                        `${COINOMAT_API}buy.php?${params.address}&${params.fiat}&${params.amount}&${params.crypto}`
                    );
                });
            }

            getCoinomatParams() {
                return {
                    address: `address=${user.address}`,
                    amount: `amount=${this.tokenizeCardPayment()}`,
                    crypto: `crypto=${this.asset.displayName}`,
                    fiat: `fiat=${this.currencies[this.chosenCurrencyIndex].fiat}`
                };
            }

            tokenizeCardPayment() {
                const cardPayment = this.cardPayment && this.cardPayment.toTokens();
                return cardPayment;
            }

            updateApproximateAmount() {
                this.approximateAmount = null;

                const params = this.getCoinomatParams();

                fetch(`${COINOMAT_API}rate.php?${params.address}&${params.amount}&${params.crypto}&${params.fiat}`)
                    .then(utils.onFetch)
                    .then((approximateAmount) => {
                        const coins = new BigNumber(approximateAmount).mul(Math.pow(10, this.asset.precision));
                        this.approximateAmount = new Waves.Money(coins.round(0), this.asset);
                        $scope.$digest();
                    });
            }

            initBankTab() {
                const sepaDetails = gatewayService.getSepaDetails(this.asset, this.address);
                if (sepaDetails) {
                    this.activateBankTab();

                    sepaDetails.then((details) => {
                        this.listOfEligibleCountries = details.listOfEligibleCountries;
                        this.idNowSiteUrl = details.idNowSiteUrl;
                        this.idNowUserLink = details.idNowUserLink;
                    });
                }

            }

            initForAllAssets() {
                const cryptocurrenciesRequests = this.getExtendedAssets(gatewayService.getCryptocurrencies());
                const cryptocurrenciesRequest = Promise.all(cryptocurrenciesRequests).then((results) => {
                    this.cryptocurrencies = results;
                });

                const invoicesRequest = waves.node.assets.userBalances().then((results) => {
                    this.invoicables = results.map((balance) => balance.asset);
                });

                const cardsRequests = this.getExtendedAssets(gatewayService.getPurchasableByCards());
                const cardsRequest = Promise.all(cardsRequests).then((results) => {
                    this.purchasablesByCards = results;
                });

                const fiatsRequests = this.getExtendedAssets(gatewayService.getFiats());
                const fiatsRequest = Promise.all(fiatsRequests).then((results) => {
                    this.fiats = results;
                });

                Promise.all([cryptocurrenciesRequest, invoicesRequest, cardsRequest, fiatsRequest]).then(() => {
                    this.updateAssetBy(this.cryptocurrencies[0].id);

                    this.activateCryptocurrencyTab();
                    this.activateInvoiceTab();
                    this.activateCardTab();
                    this.activateBankTab();

                    this.initForSingleAsset();
                });

                this.observe('chosenAssetId', ({ value: id }) => this.updateAssetAndDataBy(id));
            }

            getExtendedAssets(assetsIds) {
                return (
                    Object
                        .keys(assetsIds)
                        .map(waves.node.assets.getExtendedAsset)
                );
            }

            updateAssetAndDataBy(id) {
                this.updateAssetBy(id);

                this.initCryptocurrencyTab();
                this.updateSendLink();
                if (this.isPurchasableByCard(this.asset)) {
                    this.updateApproximateAmount();
                }
                this.initBankTab();
            }

            updateAssetBy(id) {
                this.asset = (
                    this.cryptocurrencies.find((cryptocurrency) => cryptocurrency.id === id) ||
                    this.invoicables.find((invoicable) => invoicable.id === id) ||
                    this.purchasablesByCards.find((purchasableByCards) => purchasableByCards.id === id) ||
                    this.fiats.find((fiat) => fiat.id === id)
                );
            }

            isPurchasableByCard(asset) {
                return this.purchasablesByCards.find((purchasable) => purchasable.id === asset.id);
            }

            activateCryptocurrencyTab() {
                this.showCryptocurrencyTab = true;
            }

            activateInvoiceTab() {
                this.showInvoiceTab = true;
            }

            activateCardTab() {
                this.showCardTab = true;
            }

            activateBankTab() {
                this.showBankTab = true;
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

    controller.$inject = ['Base', '$scope', 'gatewayService', 'user', 'utils', 'waves'];

    angular.module('app.utils').controller('ReceiveCtrl', controller);
})();
