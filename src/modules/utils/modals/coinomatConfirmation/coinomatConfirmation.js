(function () {
    'use strict';

    const ds = require('data-service');

    /**
     * @param {$scope} $scope
     * @param {GatewayService} gatewayService
     * @param {User} user
     * @param {ModalManager} modalManager
     * @param {$mdDialog} $mdDialog
     * @return {coinomatConfirmationCtrl}
     */
    const controller = function ($scope, gatewayService, user, modalManager, $mdDialog) {

        class CoinomatConfirmationCtrl {

            constructor(locals) {
                this.isLedger = user.userType === 'ledger';
                this.is_confirm = locals.is_confirm;

                this.hashId = null;
                this.getSignature();
            }

            getSignature() {
                this.pending = true;
                this.error = false;
                ds.signature.getSignatureApi().getPublicKey().then((pKey) => {
                    return gatewayService.sendConfirmation(pKey, this.is_confirm);
                }).then(({ next, hashId }) => {
                    this.hashId = hashId;
                    this.next = next;
                    $scope.$digest();
                    if (this.isLedger) {
                        this.confirm();
                    }
                });
            }

            onError() {
                this.pending = false;
                this.error = true;
            }

            cancel() {
                $mdDialog.cancel();
                modalManager.showSettings();
            }

            confirm() {
                this.next().then(
                    () => {
                        this.pending = false;
                        this.error = false;
                        this.cancel();
                    },
                    (e) => this.onError(e)
                );
            }

        }

        return new CoinomatConfirmationCtrl(this.locals);
    };

    controller.$inject = ['$scope', 'gatewayService', 'user', 'modalManager', '$mdDialog'];

    angular.module('app.ui').controller('coinomatConfirmationCtrl', controller);
})();
