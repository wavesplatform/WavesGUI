(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {$rootScope.Scope} $scope
     * @param {IPollCreate} createPoll
     * @param {Waves} waves
     * @return {SponsoredModalCtrl}
     */
    const controller = function (Base, $scope, createPoll, waves) {

        const { isEmpty } = require('ts-utils');
        const { SIGN_TYPE } = require('@waves/signature-adapter');
        const { Money } = require('@waves/data-entities');

        class SponsoredModalCtrl extends Base {

            /**
             * @type {number}
             */
            step = 0;
            /**
             * @readonly
             * @type {boolean}
             */
            isCreateSponsored = null;
            /**
             * @type {string}
             * @private
             */
            assetId = null;
            /**
             * @type {Money}
             */
            fee = null;
            /**
             * @type {Money}
             */
            minSponsoredAssetFee = null;
            /**
             * @type {Money}
             */
            assetBalance = null;
            /**
             * @type {Money}
             * @private
             */
            wavesBalance = null;
            /**
             * @type {ISponsorshipTx}
             * @private
             */
            _tx = null;
            /**
             * @type {Asset}
             */
            asset = null;

            constructor({ asset, isCreateSponsored }) {
                super($scope);
                this.assetId = asset.id;
                this.asset = asset;
                this.isCreateSponsored = isCreateSponsored;
                if (isEmpty(this.assetId)) {
                    throw new Error('Wrong modal params!');
                }

                createPoll(this, this._getBalances, this._setBalances, 1000, { $scope });

                this.observe(['fee', 'minSponsoredAssetFee'], this._createTx);

                this._updateFee();
            }

            onConfirm() {
                this.step++;
            }

            onBack() {
                this.step--;
            }

            getSponsoredTx() {
                return this._tx;
            }

            _createTx() {
                if (!this.fee || !this.minSponsoredAssetFee) {
                    this.signable = null;
                    return null;
                }

                const { fee, minSponsoredAssetFee } = this;
                const type = SIGN_TYPE.SPONSORSHIP;
                const tx = waves.node.transactions.createTransaction({
                    fee,
                    type,
                    minSponsoredAssetFee
                });
                this.signable = ds.signature.getSignatureApi().makeSignable({
                    type,
                    data: tx
                });
            }

            /**
             * @return {Promise}
             * @private
             */
            _getBalances() {
                return waves.node.assets.balanceList([WavesApp.defaultAssets.WAVES, this.assetId]);
            }

            /**
             * @param waves
             * @param assetBalance
             * @private
             */
            _setBalances([waves, assetBalance]) {
                this.wavesBalance = waves.available;
                this.assetBalance = assetBalance;
                this._updateAvilableFee();
            }

            /**
             * @private
             */
            _updateFee() {
                return this._getTxForFee()
                    .then(tx => waves.node.getFee({ type: WavesApp.TRANSACTION_TYPES.NODE.SPONSORSHIP, tx }))
                    .then(fee => {
                        this.fee = fee;
                        this._updateAvilableFee();
                    });
            }

            /**
             * @private
             */
            _updateAvilableFee() {
                if (this.fee && this.wavesBalance) {
                    this.canSendTransaction = this.wavesBalance.gte(this.fee);
                }
            }

            /**
             * @private
             */
            _getTxForFee() {
                return Promise.resolve(() => {
                    return { type: SIGN_TYPE.SPONSORSHIP, minSponsoredAssetFee: new Money(0, this.asset) };
                });
            }

        }

        return new SponsoredModalCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope', 'createPoll', 'waves'];

    angular.module('app.utils').controller('SponsoredModalCtrl', controller);
})();

/**
 * @typedef {object} ISponsorshipTx
 * @property {string} [id]
 * @property {14} type
 * @property {Money} fee
 * @property {Money} minSponsoredAssetFee
 */
