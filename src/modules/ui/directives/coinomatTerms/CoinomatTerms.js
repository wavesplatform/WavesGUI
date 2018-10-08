(function () {
    'use strict';

    const ds = require('data-service');
    const { SIGN_TYPE } = require('@waves/signature-adapter');

    /**
     * @param {typeof Base} Base
     * @param {$rootScope.Scope} $scope
     * @param {User} user
     * @param {CoinomatService} coinomatService
     */
    const controller = function (Base, $scope, user, coinomatService) {

        class CoinomatTerms extends Base {

            /**
             * @type {boolean}
             */
            termsAccepted = false;
            /**
             * @type {boolean}
             */
            termsAcceptedFreeze = false;
            /**
             * @type {boolean}
             */
            canShowTerms = false;
            /**
             * @type {boolean}
             */
            canShowCheckBox = false;
            /**
             * @type {boolean}
             */
            isVerified = false;
            /**
             * @type {boolean}
             */
            userModelTerms = false;
            /**
             * @type {boolean}
             */
            signPending = false;
            /**
             * @type {Signable}
             */
            signable = null;
            /**
             * @type {boolean}
             */
            forceShowTerms = false;
            /**
             * @type {boolean}
             */
            showAcceptedCheckbox = false;
            /**
             * @type {Function}
             */
            onSignStart = null;
            /**
             * @type {Function}
             */
            onSignEnd = null;
            /**
             * @type {number}
             * @private
             */
            _ts = 0;


            constructor() {
                super();

                this.observe(['forceShowTerms', 'termsAcceptedFreeze'], this._currentCanShowTerms);
                this.observe(['showAcceptedCheckbox', 'termsAcceptedFreeze'], this._currentCanShowCheckbox);

                Promise.all([
                    coinomatService.hasConfirmation(user.address),
                    coinomatService.isVerified(user.address)
                ]).then(([terms, verified]) => {

                    this.termsAccepted = terms;
                    this.userModelTerms = terms;
                    this.termsAcceptedFreeze = terms;
                    this.isVerified = verified;

                    this.observe('userModelTerms', this._onChangeTerms);
                    this._currentCanShowTerms();
                    this._currentCanShowCheckbox();

                    $scope.$apply();
                });
            }

            onSignCancel() {
                this.signPending = false;
                this.userModelTerms = this.termsAccepted;
                this.signable = null;

                this.onSignEnd();
            }

            onSignSuccess(signature) {
                return coinomatService.setCoinomatTermsAccepted(signature, this._ts, this.userModelTerms)
                    .catch(() => {
                        this.userModelTerms = this.termsAccepted;
                    })
                    .then(() => {
                        this.signPending = false;
                        this.signable = null;
                        this._ts = 0;
                        this.termsAccepted = this.userModelTerms;

                        this.onSignEnd();
                        $scope.$apply();
                    });
            }

            /**
             * @private
             */
            _currentCanShowTerms() {
                this.canShowTerms = this.forceShowTerms || !this.termsAcceptedFreeze;
            }

            /**
             * @private
             */
            _currentCanShowCheckbox() {
                this.canShowCheckBox = this.showAcceptedCheckbox || !this.termsAcceptedFreeze;
            }

            /**
             * @private
             */
            _onChangeTerms() {

                if (this.termsAccepted === this.userModelTerms) {
                    return null;
                }

                this.onSignStart();

                return coinomatService.getCoinomatTimestamp()
                    .then(ts => {
                        this._ts = ts;
                        return ts;
                    })
                    .then(CoinomatTerms._createSignable)
                    .then(signable => {
                        this.signable = signable;
                        $scope.$apply();
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

        return new CoinomatTerms();
    };

    controller.$inject = ['Base', '$scope', 'user', 'coinomatService'];

    angular.module('app.ui').component('wCoinomatTerms', {
        controller,
        scope: false,
        templateUrl: 'modules/ui/directives/coinomatTerms/coinomat-terms.html',
        bindings: {
            onSignStart: '&',
            onSignEnd: '&',
            isVerified: '=',
            termsAccepted: '=',
            forceShowTerms: '<',
            showAcceptedCheckbox: '<'
        }
    });
})();
