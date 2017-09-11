(function () {
    'use strict';

    const ASSET_IMAGES_MAP = {
        waves: '/img/waves.svg'
    };

    const ASSET_CHARS_MAP = {
        'euro': '€',
        'us dollar': '$'
    };

    const COLORS_MAP = {
        'A': '#455A64',
        'B': '#FF9933',
        '€': '#029FE4',
        '$': '#48B04C'
    };

    const DEFAULT_COLOR = '#FF9933';

    const controller = function ($element, utils) {

        class AssetLogo {

            constructor() {
                /**
                 * @type {string}
                 */
                this.name = null;
                /**
                 * @type {number}
                 */
                this.size = null;
            }

            $postLink() {
                if (!this.name || !this.size) {
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
                const name = this.name.toLowerCase();
                if (ASSET_IMAGES_MAP[name]) {
                    utils.loadImage(ASSET_IMAGES_MAP[name])
                        .then(() => {
                            $element.find('.asset-logo')
                                .css('background-image', `url(${ASSET_IMAGES_MAP[name]})`);
                        })
                        .catch(() => this._addLatter());
                } else {
                    this._addLatter();
                }
            }

            /**
             * @private
             */
            _addLatter() {
                const name = this.name.toLowerCase();
                const letter = ASSET_CHARS_MAP[name] || this.name.charAt(0)
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

    controller.$inject = ['$element', 'utils'];

    angular.module('app.ui')
        .component('wAssetLogo', {
            template: '<div class="asset-logo"></div>',
            controller: controller,
            bindings: {
                name: '@',
                size: '@'
            }
        });
})();
