(function () {
    'use strict';

    const PATH_V2 = `${WavesApp.network.coinomat}/api/v2`;
    const ds = require('data-service');
    const { prop } = require('ramda');
    const { SIGN_TYPE } = require('@waves/signature-adapter');

    /**
     * @param {typeof Base} Base
     * @param {User} user
     * @param {$rootScope.Scope} $scope
     * @return {ReceiveBank}
     */
    const controller = function (Base, user, $scope) {

        class ReceiveBank extends Base {

            /**
             * @return {boolean}
             */
            get isLira() {
                return this.asset && this.asset.id === WavesApp.defaultAssets.TRY;
            }

            /**
             * @type {boolean}
             */
            pending = false;
            /**
             * @type {boolean}
             */
            isVerified = false;
            /**
             * @type {boolean}
             */
            userTermsAcceptedModel = false;
            /**
             * @type {boolean}
             */
            isTermsAccepted = false;
            /**
             * @type {boolean}
             */
            singleAsset = true;
            /**
             * @type {Asset}
             */
            asset = null;
            /**
             * @type {string}
             */
            verifyLink = `https://go.idnow.de/coinomat/userdata/${user.address}`;
            /**
             * @type {boolean}
             */
            signPending = false;
            /**
             * @type {Signable}
             */
            signable = null;
            /**
             * @type {number}
             */
            ts = 0;
            /**
             * @type {Array}
             */
            fiats = [];


            constructor() {
                super();

                this._load();
                this.observe('userTermsAcceptedModel', this._onChangeUserTermsAcceptedModel);
            }

            onSignCancel() {
                this.signPending = false;
                this.userTermsAcceptedModel = !this.userTermsAcceptedModel;
                this.signable = null;
            }

            onSignSuccess(signature) {
                return ReceiveBank._setCoinomatTerms(signature, this.ts, this.userTermsAcceptedModel)
                    .catch(() => {
                        this.userTermsAcceptedModel = !this.userTermsAcceptedModel;
                    })
                    .then(() => {
                        this.signPending = false;
                        this.signable = null;
                        this.ts = 0;
                        this.isTermsAccepted = this.userTermsAcceptedModel;
                        $scope.$apply();
                    });
            }

            /**
             * @return {Promise}
             * @private
             */
            _load() {
                return Promise.all([
                    ReceiveBank._getVerified(),
                    ReceiveBank._getTermsAccepted()
                ]).then(([verified, termsAccepted]) => {
                    this.isVerified = verified;
                    this.isTermsAccepted = termsAccepted;
                    this.userTermsAcceptedModel = termsAccepted;
                    $scope.$apply();
                });
            }

            /**
             * @private
             */
            _onChangeUserTermsAcceptedModel() {
                this.signPending = true;

                if (this.isTermsAccepted === this.userTermsAcceptedModel) {
                    return null;
                }

                return ReceiveBank._getCoinomatTimestamp()
                    .then(ts => {
                        this.ts = ts;
                        return ts;
                    })
                    .then(ReceiveBank._createSignable)
                    .then(signable => {
                        this.signable = signable;
                        $scope.$apply();
                    });
            }

            /**
             * @return {Promise<boolean>}
             * @private
             */
            static _getVerified() {
                return ds.fetch(`${PATH_V2}/get_verification_status.php?address=${user.address}`)
                    .then(prop('verified'));
            }

            /**
             * @return {Promise<boolean>}
             * @private
             */
            static _getTermsAccepted() {
                return ds.fetch(`${PATH_V2}/get_confirmation.php?address=${user.address}`)
                    .then(prop('is_confirmed'));
            }

            /**
             * @return {Promise<number>}
             * @private
             */
            static _getCoinomatTimestamp() {
                return ds.fetch(`${PATH_V2}/get_ts.php`)
                    .then(prop('ts'));
            }

            /**
             * @param {string} signature
             * @param {number} ts
             * @param {boolean} status
             * @return {Promise<any>}
             * @private
             */
            static _setCoinomatTerms(signature, ts, status) {
                const confirmed = status ? 1 : 0;
                return ds.signature.getSignatureApi().getPublicKey().then(publicKey => {

                    const params = {
                        signature,
                        public_key: publicKey,
                        ts,
                        is_confirmed: confirmed
                    };

                    const toGetParams = params => Object.keys(params).reduce((acc, item) => {
                        const start = acc ? '&' : '';
                        return `${acc}${start}${item}=${params[item]}`;
                    }, '');

                    return ds.fetch(`${PATH_V2}/set_confirmation.php?${toGetParams(params)}`, { method: 'POST' })
                        .then(response => {
                            if (response.status === 'error') {
                                return Promise.reject('Error!');
                            }
                        });
                });
            }

            /**
             * @param {number} timestamp
             * @return {Signable}
             * @private
             */
            static _createSignable(timestamp) {
                return ds.signature.getSignatureApi().makeSignable({
                    type: SIGN_TYPE.COINOMAT_CONFIRMATION,
                    data: { timestamp }
                });
            }

        }

        return new ReceiveBank();
    };

    controller.$inject = ['Base', 'user', '$scope'];

    angular.module('app.utils').component('wReceiveBank', {
        controller,
        bindings: {
            fiats: '<',
            singleAsset: '<'
        },
        templateUrl: 'modules/utils/modals/receive/receiveBank/receive-bank.html',
        scope: false
    });

})();
