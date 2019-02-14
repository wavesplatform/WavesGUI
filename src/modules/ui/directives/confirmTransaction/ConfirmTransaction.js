/* eslint-disable no-console */
(function () {
    'use strict';

    /**
     * @param {typeof ConfirmTxService} ConfirmTxService
     * @param {$rootScope.Scope} $scope
     * @param {validateService} validateService
     * @param {app.utils} utils
     * @param {Waves} waves
     * @param {*} $attrs
     * @param {BalanceWatcher} balanceWatcher
     * @param {User} user
     * @returns {ConfirmTransaction}
     */
    const controller = function (ConfirmTxService, $scope, validateService, utils, waves, $attrs,
                                 balanceWatcher, user) {

        const { flatten } = require('ramda');
        const { SIGN_TYPE } = require('@waves/signature-adapter');


        class ConfirmTransaction extends ConfirmTxService {

            locale = $attrs.ns || 'app.ui';
            step = 0;
            type = 0;
            isSetScript = false;
            /**
             * @type {Function}
             */
            onTransactionSend;

            constructor() {
                super($scope);

                this.observe(['signable'], this._showErrors);
                this.receive(balanceWatcher.change, this._showErrors, this);
            }

            $postLink() {
                const tx = this.signable.getTxData();
                this.type = this.signable.type;

                this.isSetScript = this.type === SIGN_TYPE.SET_SCRIPT && tx.script;
                this.isTockenIssue = this.type === SIGN_TYPE.ISSUE;

                this.signable.hasMySignature().then(state => {
                    this.step = state ? 1 : 0;
                    $scope.$apply();
                });
            }

            sendTransaction() {
                return super.sendTransaction().then(data => {
                    this.onTransactionSend();
                    return data;
                });
            }

            onChangeSignable() {
                super.onChangeSignable();
                if (this.tx) {
                    this.permissionName = ConfirmTransaction._getPermissionNameByTx(this.signable.type);
                }
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

                const { type, amount, fee, senderPublicKey } = this.signable.getTxData();

                if (senderPublicKey && senderPublicKey !== user.publicKey) {
                    return null;
                }

                switch (type) {
                    case SIGN_TYPE.TRANSFER:
                        promise = Promise.all([
                            this._validateAmount(amount, false),
                            this._validateAmount(fee, true),
                            this._validateAddress()
                        ]);
                        break;
                    case SIGN_TYPE.CREATE_ORDER:
                    case SIGN_TYPE.CANCEL_LEASING:
                        promise = Promise.all([]);
                        break;
                    default:
                        promise = Promise.all([this._validateAmount(fee, true)]);
                }

                return promise.then(flatten).then((errors) => {
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
             * @param {Money} amount
             * @param {boolean} isFee
             * @return {*}
             * @private
             */
            _validateAmount(amount, isFee) {
                const errors = [];
                const hash = balanceWatcher.getBalance();

                if (!hash[amount.asset.id] ||
                    hash[amount.asset.id].lt(amount) ||
                    amount.getTokens().lte(0)) {

                    const feeLiteral = 'confirmTransaction.send.errors.fee';
                    const balanceLiteral = 'confirmTransaction.send.errors.balance.invalid';
                    const literal = isFee ? feeLiteral : balanceLiteral;

                    errors.push({
                        literal: literal,
                        data: { fee: amount }
                    });
                }

                return errors;
            }


            static _getPermissionNameByTx(type) {
                switch (type) {
                    case SIGN_TYPE.ISSUE:
                        return 'CAN_ISSUE_TRANSACTION';
                    case SIGN_TYPE.TRANSFER:
                        return 'CAN_TRANSFER_TRANSACTION';
                    case SIGN_TYPE.REISSUE:
                        return 'CAN_REISSUE_TRANSACTION';
                    case SIGN_TYPE.BURN:
                        return 'CAN_BURN_TRANSACTION';
                    case 7:
                        throw new Error('Can\' confirm exchange transaction!');
                    case SIGN_TYPE.LEASE:
                        return 'CAN_LEASE_TRANSACTION';
                    case SIGN_TYPE.CANCEL_LEASING:
                        return 'CAN_CANCEL_LEASE_TRANSACTION';
                    case SIGN_TYPE.CREATE_ALIAS:
                        return 'CAN_CREATE_ALIAS_TRANSACTION';
                    case SIGN_TYPE.MASS_TRANSFER:
                        return 'CAN_MASS_TRANSFER_TRANSACTION';
                    case SIGN_TYPE.DATA:
                        return 'CAN_DATA_TRANSACTION';
                    case SIGN_TYPE.SET_SCRIPT:
                        return 'CAN_SET_SCRIPT_TRANSACTION';
                    case SIGN_TYPE.SPONSORSHIP:
                        return 'CAN_SPONSORSHIP_TRANSACTION';
                    case SIGN_TYPE.CREATE_ORDER:
                        return 'CAN_CREATE_ORDER';
                    case SIGN_TYPE.CANCEL_ORDER:
                        return 'CAN_CANCEL_ORDER';
                    default:
                        return '';
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
        '$attrs',
        'balanceWatcher',
        'user'
    ];

    angular.module('app.ui').component('wConfirmTransaction', {
        bindings: {
            signable: '<',
            onClickBack: '&',
            onTxSent: '&',
            noBackButton: '<',
            warning: '<',
            onTransactionSend: '&',
            referrer: '<'
        },
        templateUrl: 'modules/ui/directives/confirmTransaction/confirmTransaction.html',
        transclude: false,
        controller
    });
})();
