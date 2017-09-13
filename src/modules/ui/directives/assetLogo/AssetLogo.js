(function () {
    'use strict';

    const ASSET_IMAGES_MAP = {
        [WavesApp.defaultAssets.Waves]: '/img/waves.svg'
    };

    const ASSET_CHARS_MAP = {
        [WavesApp.defaultAssets.EUR]: '€',
        [WavesApp.defaultAssets.USD]: '$'
    };

    const COLORS_MAP = {
        'A': '#455A64',
        'B': '#FF9933',
        '€': '#029FE4',
        '$': '#48B04C'
    };

    const DEFAULT_COLOR = '#FF9933';

    /**
     * @param {JQuery} $element
     * @param utils
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
