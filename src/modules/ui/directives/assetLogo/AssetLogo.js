(function () {
    'use strict';

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
        [WavesApp.defaultAssets.BSV]: '/img/assets/bitcoin-cash-sv.svg',
        [WavesApp.defaultAssets.TRY]: '/img/assets/try.svg',
        [WavesApp.defaultAssets.XMR]: '/img/assets/xmr.svg',
        [WavesApp.otherAssetsWithIcons.EFYT]: '/img/assets/efyt.svg',
        [WavesApp.otherAssetsWithIcons.WNET]: '/img/assets/wnet.svg'
    };

    const ds = require('data-service');
    const { isEmpty } = require('ts-utils');

    const COLORS_LIST = [
        '#39a12c',
        '#6a737b',
        '#e49616',
        '#008ca7',
        '#ff5b38',
        '#ff6a00',
        '#c74124',
        '#00a78e',
        '#b01e53',
        '#e0c61b',
        '#5a81ea',
        '#72b7d2',
        '#a5b5c3',
        '#81c926',
        '#86a3bd',
        '#c1d82f',
        '#5c84a8',
        '#267e1b',
        '#fbb034',
        '#ff846a',
        '#47c1ff',
        '#00a0af',
        '#85d7c6',
        '#8a7967',
        '#26c1c9',
        '#72d28b'
    ];

    /**
     * @param Base
     * @param {JQuery} $element
     * @param {app.utils} utils
     * @param {Waves} waves
     * @return {AssetLogo}
     */
    const controller = function (Base, $element, utils, waves) {

        class AssetLogo extends Base {

            /**
             * @type {string}
             */
            assetId;
            /**
             * @type {string}
             */
            assetName;
            /**
             * @type {number}
             */
            size;
            /**
             * @type {boolean}
             */
            hasScript;
            /**
             * @type {boolean}
             * @private
             */
            _canPayFee = false;
            /**
             * @type {boolean}
             * @private
             */
            _isSmart = false;


            constructor() {
                super();

                this.observe('_canPayFee', this._onChangeCanPayFee);
                this.observe(['_isSmart', 'hasScript'], this._onChangeIsSmart);
            }


            $postLink() {
                if (!this.size || !(this.assetName || this.assetId)) {
                    throw new Error('Wrong params!');
                }

                this._canPayFee = !!ds.utils.getTransferFeeList()
                    .find(money => money.asset.id === this.assetId);

                if (this.assetId) {
                    waves.node.assets.getAsset(this.assetId).then(asset => {
                        this._isSmart = asset.hasScript;
                    });
                }

                $element.find('.asset__logo')
                    .css({
                        width: `${this.size}px`,
                        height: `${this.size}px`
                    });

                this._addLogo();
            }

            /**
             * @private
             */
            _addLogo() {
                if (this.assetId) {
                    const data = ds.dataManager.getOracleAssetData(this.assetId);
                    if (data && data.logo) {
                        $element.find('.asset__logo')
                            .addClass('custom')
                            .css('backgroundImage', `url(${data.logo})`);
                        return null;
                    }
                    waves.node.assets.getAsset(this.assetId)
                        .then((asset) => {
                            if (ASSET_IMAGES_MAP[asset.id]) {
                                utils.loadImage(ASSET_IMAGES_MAP[asset.id])
                                    .then(() => {
                                        $element.find('.asset__logo')
                                            .css('backgroundImage', `url(${ASSET_IMAGES_MAP[asset.id]})`);
                                    })
                                    .catch(() => this._addLetter(asset.name));
                            } else {
                                this._addLetter(asset.name);
                            }
                        });
                } else {
                    this.observe('assetName', () => this._addLetter(this.assetName));
                    this._addLetter(this.assetName);
                }
            }

            /**
             * @param {string} name
             * @private
             */
            _addLetter(name) {
                const letter = name.charAt(0)
                    .toUpperCase();
                const color = this._getColor();
                const fontSize = Math.round((Number(this.size) || 0) * 0.43);
                $element.find('.asset__logo')
                    .css({
                        'background-color': color
                    });
                $element.find('.asset__logo .letter')
                    .text(letter)
                    .css({
                        'font-size': `${fontSize}px`
                    });
                $element.find('.asset__logo .marker')
                    .css({
                        'background-color': color
                    });
            }

            /**
             * @return {string}
             * @private
             */
            _getColor() {
                const sum = this.assetId.split('')
                    .slice(3)
                    .map(char => char.charCodeAt(0))
                    .reduce((acc, code) => acc + code, 0);
                return COLORS_LIST[sum % COLORS_LIST.length];
            }

            /**
             * @private
             */
            _onChangeCanPayFee() {
                $element.find('.marker').toggleClass('sponsored-asset', this._canPayFee);
            }

            /**
             * @private
             */
            _onChangeIsSmart() {
                const isSmart = isEmpty(this.hasScript) ? this._isSmart : this.hasScript;
                $element.find('.marker').toggleClass('smart-asset', isSmart);
            }

        }

        return new AssetLogo();
    };

    controller.$inject = ['Base', '$element', 'utils', 'waves'];

    angular.module('app.ui')
        .component('wAssetLogo', {
            template: '<div class="asset__logo footnote-3"><div class="letter"></div><div class="marker"></div></div>',
            controller: controller,
            bindings: {
                assetId: '@',
                hasScript: '<',
                assetName: '<',
                size: '@'
            }
        });
})();
