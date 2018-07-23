(function () {
    'use strict';

    const Handlebars = require('handlebars');

    // TODO @xenohunter : remove that when icons are in @dvshur's service
    const ASSET_IMAGES_MAP = {
        [WavesApp.defaultAssets.WAVES]: '/img/assets/waves.svg',
        [WavesApp.defaultAssets.BTC]: '/img/assets/bitcoin.svg',
        [WavesApp.defaultAssets.ETH]: '/img/assets/ethereum.svg',
        [WavesApp.defaultAssets.LTC]: '/img/assets/ltc.svg',
        [WavesApp.defaultAssets.ZEC]: '/img/assets/zec.svg',
        [WavesApp.defaultAssets.EUR]: '/img/assets/euro.svg',
        [WavesApp.defaultAssets.USD]: '/img/assets/usd.svg',
        [WavesApp.defaultAssets.DASH]: '/img/assets/dash.svg',
        [WavesApp.defaultAssets.BCH]: '/img/assets/bitcoin-cash.svg',
        [WavesApp.defaultAssets.TRY]: '/img/assets/try.svg',
        [WavesApp.defaultAssets.XMR]: '/img/assets/xmr.svg',
        [WavesApp.otherAssetsWithIcons.EFYT]: '/img/assets/efyt.svg',
        [WavesApp.otherAssetsWithIcons.WNET]: '/img/assets/wnet.svg'
    };

    const COLORS_MAP = {
        A: '#39a12c',
        B: '#6a737b',
        C: '#e49616',
        D: '#008ca7',
        E: '#ff5b38',
        F: '#ff6a00',
        G: '#c74124',
        H: '#00a78e',
        I: '#b01e53',
        J: '#e0c61b',
        K: '#5a81ea',
        L: '#72b7d2',
        M: '#a5b5c3',
        N: '#81c926',
        O: '#86a3bd',
        P: '#c1d82f',
        Q: '#5c84a8',
        R: '#267e1b',
        S: '#fbb034',
        T: '#ff846a',
        U: '#47c1ff',
        V: '#00a0af',
        W: '#85d7c6',
        X: '#8a7967',
        Y: '#26c1c9',
        Z: '#72d28b'
    };

    const DEFAULT_COLOR = '#96bca0';

    const TEMPLATE_PATH = 'modules/wallet/modules/portfolio/directives/portfolioRow/row.hbs';
    const SELECTORS = {
        AVAILABLE: 'js-balance-available',
        IN_ORDERS: 'js-balance-in-orders',
        BASE_ASSET_BALANCE: 'js-balance-in-base-asset',
        EXCHANGE_RATE: 'js-exchange-rate',
        CHANGE_24: 'js-change-24',
        ACTIONS: 'js-actions',
        BUTTONS: {
            SEND: {
                MAIN: 'js-button-send',
                TITLE: 'js-button-send-title'
            },
            RECEIVE: {
                MAIN: 'js-button-receive',
                TITLE: 'js-button-receive-title'
            },
            DEX: {
                MAIN: 'js-button-open-in-dex',
                TITLE: 'js-button-open-in-dex-title'
            },
            TOGGLE_SPAM: {
                MAIN: 'js-button-toggle-spam',
                TITLE: 'js-button-toggle-spam-title'
            }
        }
    };

    class PortfolioRow {

        constructor($templateRequest, $element, utils) {
            /**
             * @type {Promise<Function>}
             */
            this.templatePromise = $templateRequest(TEMPLATE_PATH).then((html) => Handlebars.compile(html));
            /**
             * @type {JQuery}
             */
            this.$node = $element;
            /**
             * @type {IBalanceDetails}
             */
            this.balance = null;
            /**
             * @type {app.utils}
             */
            this.utils = utils;
        }

        $postLink() {
            this.templatePromise.then((template) => {
                const firstAssetChar = this.balance.asset.name.slice(0, 1);

                const html = template({
                    assetIconPath: ASSET_IMAGES_MAP[this.balance.asset.id],
                    firstAssetChar,
                    charColor: COLORS_MAP[firstAssetChar.toUpperCase()] || DEFAULT_COLOR,
                    assetName: this.balance.asset.name,
                    SELECTORS: { ...SELECTORS },
                    canShowDex: this._canShowDex(),
                    canShowToggleSpam: this._canShowToggleSpam()
                });

                this.$node.append(html);
            });
        }

        _canShowDex() {
            return true; // TODO!
        }

        _canShowToggleSpam() {
            return true; // TODO!
        }

    }

    PortfolioRow.$inject = ['$templateRequest', '$element', 'utils'];

    angular.module('app.wallet.portfolio').component('wPortfolioRow', {
        controller: PortfolioRow,
        bindings: {
            balance: '<'
        },
        scope: false
    });

})();
