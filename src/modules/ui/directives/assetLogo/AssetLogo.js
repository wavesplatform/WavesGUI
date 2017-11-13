(function () {
    'use strict';

    const ASSET_IMAGES_MAP = {
        [WavesApp.defaultAssets.WAVES]: '/img/assets/waves.svg',
        [WavesApp.defaultAssets.BTC]: '/img/assets/bitcoin.svg',
        [WavesApp.defaultAssets.ETH]: '/img/assets/ethereum.svg',
        [WavesApp.defaultAssets.EUR]: '/img/assets/euro.png',
        [WavesApp.defaultAssets.USD]: '/img/assets/dollar.png'
    };

    const ASSET_CHARS_MAP = {
        // [WavesApp.defaultAssets.USD]: '$'
    };

    const COLORS_MAP = {
        'A': '#39A12C',
        'B': '#6A737B',
        'C': '#E49616',
        'D': '#008CA7',
        'E': '#FF5B38',
        'F': '#FF6A00',
        'G': '#C74124',
        'H': '#00A78E',
        'I': '#B01E53',
        'J': '#E0C61B',
        'K': '#5A81EA',
        'L': '#72B7D2',
        'M': '#A5B5C3',
        'N': '#81C926',
        'O': '#86A3BD',
        'P': '#C1D82F',
        'Q': '#5C84A8',
        'R': '#267E1B',
        'S': '#FBB034',
        'T': '#FF846A',
        'U': '#47C1FF',
        'V': '#00A0AF',
        'W': '#85D7C6',
        'X': '#8A7967',
        'Y': '#26C1C9',
        'Z': '#72D28B'
    };

    const DEFAULT_COLOR = '#FF9933';

    /**
     * @param {JQuery} $element
     * @param {app.utils} utils
     * @param {AssetsService} assetsService
     * @return {AssetLogo}
     */
    const controller = function ($element, utils, assetsService) {

        class AssetLogo {

            constructor() {
                /**
                 * @type {string}
                 */
                this.assetId = null;
                /**
                 * @type {number}
                 */
                this.size = null;
            }

            $postLink() {
                if (!this.assetId || !this.size) {
                    throw new Error('Wrong params!');
                }
                $element.find('.asset-logo')
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
                assetsService.getAssetInfo(this.assetId)
                    .then((asset) => {
                        if (ASSET_IMAGES_MAP[asset.id]) {
                            utils.loadImage(ASSET_IMAGES_MAP[asset.id])
                                .then(() => {
                                    $element.find('.asset-logo')
                                        .css('background-image', `url(${ASSET_IMAGES_MAP[asset.id]})`);
                                })
                                .catch(() => this._addLatter(asset));
                        } else {
                            this._addLatter(asset);
                        }
                    });
            }

            /**
             * @private
             */
            _addLatter(asset) {
                const letter = ASSET_CHARS_MAP[asset.id] || asset.name.charAt(0)
                    .toUpperCase();
                const color = COLORS_MAP[letter] || DEFAULT_COLOR;
                const fontSize = Math.round((Number(this.size) || 0) * 0.8);
                $element.find('.asset-logo')
                    .text(letter)
                    .css({
                        'background-color': color,
                        'font-size': `${fontSize}px`,
                        'line-height': `${this.size}px`
                    });
            }

        }

        return new AssetLogo();
    };

    controller.$inject = ['$element', 'utils', 'assetsService'];

    angular.module('app.ui')
        .component('wAssetLogo', {
            template: '<div class="asset-logo"></div>',
            controller: controller,
            bindings: {
                assetId: '@',
                size: '@'
            }
        });
})();
