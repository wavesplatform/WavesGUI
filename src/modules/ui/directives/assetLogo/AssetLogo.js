(function () {
    'use strict';

    const ASSET_IMAGES_MAP = {
        [WavesApp.defaultAssets.WAVES]: '/img/assets/waves.svg',
        [WavesApp.defaultAssets.BTC]: '/img/assets/bitcoin.svg',
        [WavesApp.defaultAssets.ETH]: '/img/assets/ethereum.svg',
        [WavesApp.defaultAssets.EUR]: '/img/assets/euro.png',
        [WavesApp.defaultAssets.USD]: '/img/assets/dollar.png'
    };

    const COLORS_MAP = {
        'A': '#39a12c',
        'B': '#6a737b',
        'C': '#e49616',
        'D': '#008ca7',
        'E': '#ff5b38',
        'F': '#ff6a00',
        'G': '#c74124',
        'H': '#00a78e',
        'I': '#b01e53',
        'J': '#e0c61b',
        'K': '#5a81ea',
        'L': '#72b7d2',
        'M': '#a5b5c3',
        'N': '#81c926',
        'O': '#86a3bd',
        'P': '#c1d82f',
        'Q': '#5c84a8',
        'R': '#267e1b',
        'S': '#fbb034',
        'T': '#ff846a',
        'U': '#47c1ff',
        'V': '#00a0af',
        'W': '#85d7c6',
        'X': '#8a7967',
        'Y': '#26c1c9',
        'Z': '#72d28b'
    };

    const DEFAULT_COLOR = '#96bca0';

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
                                .catch(() => this._addLetter(asset));
                        } else {
                            this._addLetter(asset);
                        }
                    });
            }

            /**
             * @private
             */
            _addLetter(asset) {
                const letter = asset.name.charAt(0)
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
