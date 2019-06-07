(function () {
    'use strict';

    // TODO: delete after contest
    const CONTEST_ASSET_ID_MAP = {
        Gsj1azEwNuUTss5FHLPbgR6FGya284Q843tCrrFgi4VZ: '/img/assets/wsoc.svg',
        JCm9j4nBQ8tXE2kRKzhgoV6jqVm1QC3FeXLcKwsLdRyG: '/img/assets/wsoc.svg',
        HjcJSVFeo34WD1QFFonRa3boQAkRLZxCdURJU73Ffcga: '/img/assets/wsoc.svg',
        F33CKa4cPB9fK5oA3aUZKAtDJtdohvEzX84Hkwthep5V: '/img/assets/wsoc.svg'
    };
    // TODO: delete after contest

    const ds = require('data-service');
    const { isEmpty } = require('ts-utils');

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
                            } else if (CONTEST_ASSET_ID_MAP[asset.id]) {
                                // TODO: delete after contest
                                utils.loadImage(CONTEST_ASSET_ID_MAP[asset.id])
                                    .then(() => {
                                        $element.find('.asset__logo')
                                            .addClass('custom')
                                            .css('backgroundImage', `url(${CONTEST_ASSET_ID_MAP[asset.id]})`);
                                    })
                                    .catch(() => this._addLetter(asset.name));
                                // TODO: delete after contest
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
                const color = utils.getAssetLogoBackground(this.assetId);
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
