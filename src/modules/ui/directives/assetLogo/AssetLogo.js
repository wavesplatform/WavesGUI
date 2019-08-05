(function () {
    'use strict';

    const ds = require('data-service');
    const { isEmpty } = require('ts-utils');

    /**
     * @param Base
     * @param {ng.IAugmentedJQuery} $element
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
             */
            isNew = false;
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
                if (!this.size) {
                    throw new Error('Wrong params!');
                }

                if (!this.isNew) {
                    if (!(this.assetName || this.assetId)) {
                        throw new Error('Wrong params!');
                    }

                    this._canPayFee = !!ds.utils.getTransferFeeList()
                        .find(money => money.asset.id === this.assetId);

                    if (this.assetId) {
                        waves.node.assets.getAsset(this.assetId).then(asset => {
                            this._isSmart = asset.hasScript;
                        });
                    }
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
                if (!this.isNew && this.assetId) {
                    const { logo } = utils.getDataFromOracles(this.assetId);

                    if (logo) {
                        $element.find('.asset__logo')
                            .addClass('custom')
                            .css('backgroundImage', `url(${logo})`);
                        return null;
                    }

                    waves.node.assets.getAsset(this.assetId)
                        .then((asset) => {
                            const logo = utils.getAssetLogo(this.assetId);

                            if (logo) {
                                utils.loadImage(logo)
                                    .then(() => {
                                        $element.find('.asset__logo')
                                            .css('backgroundImage', `url(${logo})`);
                                    })
                                    .catch(() => this._addLetter(asset.name));
                            } else {
                                this._addLetter(asset.name);
                            }
                        });
                } else {
                    $element.addClass('asset-logo_new');
                    this.observe(['assetName', 'assetId'], () => this._addLetter(this.assetName));
                    this._addLetter(this.assetName);
                }
            }

            /**
             * @param {string} name
             * @private
             */
            _addLetter(name) {
                const letter = name.charAt(0).toUpperCase();
                const color = utils.getAssetLogoBackground(this.assetId);
                const fontSize = Math.round((Number(this.size) || 0) * 0.43);

                $element.find('.asset__logo, .asset__logo .marker')
                    .css({
                        'background-color': color
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
                assetId: '<',
                hasScript: '<',
                assetName: '<',
                isNew: '<',
                size: '@'
            }
        });
})();
