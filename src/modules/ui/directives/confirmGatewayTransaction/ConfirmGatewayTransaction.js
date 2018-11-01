/* eslint-disable no-console */
(function () {
    'use strict';

    const ds = require('data-service');

    /**
     * @param Base
     * @param {Waves} waves
     * @param {User} user
     * @param {$rootScope.Scope} $scope
     * @returns {ConfirmGatewayTransaction}
     * @param {$mdDialog} $mdDialog
     * @param {modalManager} modalManager
     */
    const controller = function (Base, waves, user, $scope, $mdDialog, modalManager) {

        class ConfirmGatewayTransaction extends Base {

            constructor() {
                super();
                this.type = user.userType;
                this.step = 0;
            }

            trySign() {
                return this.getTxData();
            }

            $postLink() {
                this._onChangeTx();
                this.trySign();
            }

            /**
             * @return {boolean}
             */
            canSignFromDevice() {
                return this.type && this.type !== 'seed' || false;
            }

            getTxId() {
                return this._signable.getId();
            }

            signTx() {
                this.loadingSignFromDevice = this.canSignFromDevice();
                return this._signable.getDataForApi();
            }

            getTxData() {
                this.getTxId()
                    .then(() => {
                        this.deviceSignFail = false;
                        this.loadingSignFromDevice = this.canSignFromDevice();
                        $scope.$digest();
                        return this.signTx();
                    })
                    .then(preparedTx => {
                        this.preparedTx = preparedTx;

                        if (this.canSignFromDevice() && !this.wasDestroed) {
                            this.confirm();
                        }
                    })
                    .catch(() => {
                        this.loadingSignFromDevice = false;
                        this.deviceSignFail = true;
                        $scope.$digest();
                    });
            }

            confirm() {
                return this.sendTransaction().then(({ id }) => {
                    this.tx.id = id;
                    this.step++;
                    analytics.push(
                        'Gateway', `Gateway.Send.${WavesApp.type}`,
                        `Gateway.Send.${WavesApp.type}.Success`, this.tx.amount);
                    // this.onTxSent({ id });
                    $scope.$apply();
                }).catch((e) => {
                    this.loadingSignFromDevice = false;
                    console.error(e);
                    console.error('Gateway transaction error!');
                    analytics.push(
                        'Gateway', `Gateway.Send.${WavesApp.type}`,
                        `Gateway.Send.${WavesApp.type}.Error`, this.tx.amount);
                    $scope.$apply();
                });
            }

            showTxInfo() {
                $mdDialog.hide();
                setTimeout(() => { // Timeout for routing (if modal has route)
                    modalManager.showTransactionInfo(this.tx.id);
                }, 1000);
            }

            sendTransaction() {
                return ds.broadcast(this.preparedTx);
            }

            _onChangeTx() {
                const timestamp = ds.utils.normalizeTime(this.tx.timestamp || Date.now());

                let amount = this.tx.amount;
                amount = amount.cloneWithTokens(amount.getTokens().plus(this.gatewayDetails.gatewayFee));

                const type = 4;
                const data = { ...this.tx, amount, timestamp };

                this._signable = ds.signature.getSignatureApi()
                    .makeSignable({ type, data });

                this._signable.getId().then(id => {
                    this.txId = id;
                    $scope.$digest();
                });
            }

        }

        return new ConfirmGatewayTransaction();
    };

    controller.$inject = ['Base', 'waves', 'user', '$scope', '$mdDialog', 'modalManager'];

    angular.module('app.ui').component('wConfirmGatewayTransaction', {
        bindings: {
            tx: '<',
            gatewayDetails: '<',
            targetRecipient: '<',
            onClickBack: '&'
        },
        templateUrl: 'modules/ui/directives/confirmGatewayTransaction/confirmGatewayTransaction.html',
        transclude: false,
        controller
    });
})();
