/* eslint-disable no-console */
(function () {
    'use strict';

    /**
     * @param {typeof ConfirmTxService} ConfirmTxService
     * @param {$rootScope.Scope} $scope
     */
    const controller = function (ConfirmTxService, $scope) {

        class ConfirmGatewayTransaction extends ConfirmTxService {

            /**
             * @type {string}
             */
            targetRecipient = '';
            /**
             * @type {IGatewayDetails}
             */
            gatewayDetails = null;

            constructor(props) {
                super(props);
                this.observe(['gatewayDetails', 'tx'], () => {
                    if (!this.gatewayDetails || !this.tx) {
                        return null;
                    }

                    const fee = this.tx.amount.cloneWithTokens(this.gatewayDetails.gatewayFee);
                    this.tx.amount = this.tx.amount.sub(fee);
                });
            }

            getEventName() {
                return 'Gateway';
            }

        }

        return new ConfirmGatewayTransaction($scope);
    };

    controller.$inject = ['ConfirmTxService', '$scope'];

    angular.module('app.ui').component('wConfirmGatewayTransaction', {
        bindings: {
            signable: '<',
            gatewayDetails: '<',
            targetRecipient: '<',
            onClickBack: '&'
        },
        templateUrl: 'modules/ui/directives/confirmGatewayTransaction/confirmGatewayTransaction.html',
        scope: false,
        transclude: false,
        controller
    });
})();
