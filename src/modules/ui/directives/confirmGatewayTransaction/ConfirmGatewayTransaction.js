/* eslint-disable no-console */
(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @param {User} user
     * @param {$rootScope.Scope} $scope
     * @returns {ConfirmGatewayTransaction}
     */
    const controller = function (Base, waves, user, $scope) {

        class ConfirmGatewayTransaction extends Base {

            constructor() {
                super();

                this.step = 0;
            }

            confirm() {
                let amount = this.tx.amount;
                amount = amount.cloneWithTokens(amount.getTokens().plus(this.gatewayDetails.gatewayFee));

                return ds.broadcast(4, { ...this.tx, amount }).then(({ id }) => {
                    this.tx.id = id;
                    this.step++;
                    analytics.push(
                        'Gateway', `Gateway.Send.${WavesApp.type}`,
                        `Gateway.Send.${WavesApp.type}.Success`, this.tx.amount);
                    $scope.$apply();
                }).catch((e) => {
                    console.error(e);
                    console.error('Gateway transaction error!');
                    analytics.push(
                        'Gateway', `Gateway.Send.${WavesApp.type}`,
                        `Gateway.Send.${WavesApp.type}.Error`, this.tx.amount);
                    $scope.$apply();
                });
            }

        }

        return new ConfirmGatewayTransaction();
    };

    controller.$inject = ['Base', 'waves', 'user', '$scope'];

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
