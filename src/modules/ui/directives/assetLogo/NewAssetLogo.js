(function () {
    'use strict';

    const { isEmpty } = require('ts-utils');

    /**
     * @param Base
     * @param {JQuery} $element
     * @param {app.utils} utils
     * @return {NewAssetLogo}
     */
    const controller = function (Base, $element, utils) {

        class NewAssetLogo extends Base {

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


            constructor() {
                super();

                this.observe('hasScript', this._onChangeIsSmart);
                this.observe(['assetName', 'assetId'], this._addLetter);
            }


            $postLink() {
                if (!this.size) {
                    throw new Error('Wrong params!');
                }

                $element.find('.asset__logo')
                    .css({
                        width: `${this.size}px`,
                        height: `${this.size}px`
                    });
            }

            /**
             * @private
             */
            _addLetter() {
                if (!this.assetName || !this.assetId) {
                    return null;
                }

                const letter = this.assetName.charAt(0).toUpperCase();
                const color = utils.getAssetLogoBackground(this.assetId);
                const fontSize = Math.round((Number(this.size) || 0) * 0.43);

                ['.asset__logo', '.asset__logo .marker'].forEach(selector => {
                    $element.find(selector).css('background-color', color);
                });

                $element.find('.asset__logo .letter')
                    .text(letter)
                    .css({
                        'font-size': `${fontSize}px`
                    });
            }

            /**
             * @private
             */
            _onChangeIsSmart() {
                const isSmart = isEmpty(this.hasScript) ? this._isSmart : this.hasScript;
                $element.find('.marker').toggleClass('smart-asset', isSmart);
            }

        }

        return new NewAssetLogo();
    };

    controller.$inject = ['Base', '$element', 'utils'];

    angular.module('app.ui')
        .component('wNewAssetLogo', {
            template: '<div class="asset__logo footnote-3"><div class="letter"></div><div class="marker"></div></div>',
            controller: controller,
            bindings: {
                assetId: '<',
                hasScript: '<',
                assetName: '<',
                size: '@'
            }
        });
})();
