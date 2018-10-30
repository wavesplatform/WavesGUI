/* eslint-disable no-console */
(function () {
    'use strict';

    /**
     * @param {typeof ConfirmTxService} ConfirmTxService
     * @param {$rootScope.Scope} $scope
     * @param {validateService} validateService
     * @param {app.utils} utils
     * @param {Waves} waves
     * @returns {ConfirmTransaction}
     */
    const controller = function (ConfirmTxService, $scope, validateService, utils, waves, $attrs) {

        const { TRANSACTION_TYPE_NUMBER, SIGN_TYPE } = require('@waves/signature-adapter');


        class ConfirmTransaction extends ConfirmTxService {

            locale = $attrs.ns || 'app.ui';
            step = 0;

            constructor() {
                super($scope);

                this.observe(['showValidationErrors', 'signable'], this._showErrors);
            }

            $postLink() {
                this.isTockenIssue = this.signable.getTxData().type === SIGN_TYPE.ISSUE;
                this.signable.hasMySignature().then(state => {
                    this.step = state ? 1 : 0;
                    $scope.$apply();
                });
            }

            getSignable() {
                return this.signable;
            }

            nextStep() {
                this.step++;
                this.initExportLink();
            }

            /**
             * @private
             */
            _showErrors() {
                if (!this.signable) {
                    return null;
                }

                let promise;

                const { type, amount, fee } = this.signable.getTxData();

                switch (true) {
                    case (type === TRANSACTION_TYPE_NUMBER.SPONSORSHIP):
                        promise = this._validateAmount(fee);
                        break;
                    case (type === TRANSACTION_TYPE_NUMBER.TRANSFER && this.showValidationErrors):
                        promise = Promise.all([
                            this._validateAmount(amount),
                            this._validateAddress()
                        ]).then(([errors1, errors2]) => [...errors1, ...errors2]);
                        break;
                    default:
                        promise = Promise.resolve([]);
                }

                return promise.then((errors) => {
                    this.errors = errors;
                    $scope.$apply();
                });
            }

            /**
             * @return {Promise<Array | never>}
             * @private
             */
            _validateAddress() {
                const { recipient } = this.signable.getTxData();
                const errors = [];
                return utils.resolve(utils.when(validateService.wavesAddress(recipient)))
                    .then(({ state }) => {
                        if (!state) {
                            errors.push({
                                literal: 'confirmTransaction.send.errors.recipient.invalid'
                            });
                        }
                        return errors;
                    });
            }

            /**
             * @param amount
             * @return {*}
             * @private
             */
            _validateAmount(amount) {
                const errors = [];
                const { type } = this.signable.getTxData();

                if (type === TRANSACTION_TYPE_NUMBER.SPONSORSHIP) {
                    return waves.node.assets.userBalances()
                        .then((list) => list.map(({ available }) => available))
                        .then((list) => {
                            const hash = utils.toHash(list, 'asset.id');
                            if (!hash[amount.asset.id] ||
                                hash[amount.asset.id].lt(amount) ||
                                amount.getTokens().lte(0)) {

                                errors.push({
                                    literal: 'confirmTransaction.send.errors.balance.invalid'
                                });
                            }

                            return errors;
                        });
                } else {
                    return Promise.resolve([]);
                }
            }


        }

        return new ConfirmTransaction();
    };

    controller.$inject = [
        'ConfirmTxService',
        '$scope',
        'validateService',
        'utils',
        'waves',
        '$attrs'
    ];

    angular.module('app.ui').component('wConfirmTransaction', {
        bindings: {
            signable: '<',
            onClickBack: '&',
            onTxSent: '&',
            noBackButton: '<',
            warning: '<',
            showValidationErrors: '<',
            referrer: '<'
        },
        templateUrl: 'modules/ui/directives/confirmTransaction/confirmTransaction.html',
        transclude: false,
        controller
    });
})();
