(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {$rootScope.Scope} $scope
     * @param {Waves} waves
     * @param {BalanceWatcher} balanceWatcher
     * @param {app.utils} utils
     * @return {SponsoredModalCtrl}
     */
    const controller = function (Base, $scope, waves, balanceWatcher, utils) {

        const { isEmpty } = require('ts-utils');
        const { SIGN_TYPE } = require('@waves/signature-adapter');
        const { Money } = require('@waves/data-entities');
        const ds = require('data-service');
        const { path } = require('ramda');
        const analytics = require('@waves/event-sender');

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

                const { STATUS_LIST } = require('@waves/oracle-data');
                const data = ds.dataManager.getOracleAssetData(asset.id);
                this.isVerified = path(['status'], data) === STATUS_LIST.VERIFIED;
                this.isGateway = path(['status'], data) === 3;
                this.ticker = asset.ticker;
                this.description = path(['description', 'en'], data) || asset.description;

                if (isEmpty(this.assetId)) {
                    throw new Error('Wrong modal params!');
                }

                this.receive(balanceWatcher.change, this._updateBalances, this);
                this._updateBalances();

                this.observe(['fee', 'minSponsoredAssetFee'], this._createTx);

                this._updateFee();
            }

            getSignable() {
                return this.signable;
            }

            onConfirm() {
                analytics.send({ name: 'Enable Sponsorship Continue Click', target: 'ui' });
                this.step++;
            }

            onBack() {
                this.step--;
            }

            getSponsoredTx() {
                return this._tx;
            }

            /**
             * @private
             */
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

            _updateBalances() {
                Promise.all([
                    balanceWatcher.getBalanceByAssetId(WavesApp.defaultAssets.WAVES),
                    balanceWatcher.getBalanceByAssetId(this.assetId)
                ]).then(([waves, asset]) => {
                    this.wavesBalance = waves;
                    this.assetBalance = asset;
                    this._updateAvailableFee();
                    utils.safeApply($scope);
                });
            }

            /**
             * @private
             */
            _updateFee() {
                return this._getTxForFee()
                    .then(tx => waves.node.getFee(tx))
                    .then(fee => {
                        this.fee = fee;
                        this._updateAvailableFee();
                    });
            }

            /**
             * @private
             */
            _updateAvailableFee() {
                if (this.fee && this.wavesBalance) {
                    this.canSendTransaction = this.wavesBalance.gte(this.fee);
                }
            }

            /**
             * @private
             */
            _getTxForFee() {
                return Promise.resolve({
                    type: SIGN_TYPE.SPONSORSHIP,
                    minSponsoredAssetFee: new Money(0, this.asset)
                });
            }

        }

        return new SponsoredModalCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope', 'waves', 'balanceWatcher', 'utils'];

    angular.module('app.utils').controller('SponsoredModalCtrl', controller);
})();

/**
 * @typedef {object} ISponsorshipTx
 * @property {string} [id]
 * @property {14} type
 * @property {Money} fee
 * @property {Money} minSponsoredAssetFee
 */
