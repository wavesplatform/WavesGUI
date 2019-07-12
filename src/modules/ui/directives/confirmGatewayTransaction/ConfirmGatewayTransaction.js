/* eslint-disable no-console */
(function () {
    'use strict';

    const analytics = require('@waves/event-sender');
    const ds = require('data-service');

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

            sendTransaction() {
                if (this.signable.getTxData().amount.asset.id !== WavesApp.defaultAssets.VST) {
                    return super.sendTransaction();
                }

                return this.signable.getDataForApi()
                    .then(data => {
                        return ds.fetch(`${WavesApp.network.vostok.gateway}/api/v1/external/send`, {
                            method: 'POST',
                            body: WavesApp.stringifyJSON({
                                ...data,
                                sender: ds.app.address
                            })
                        });
                    })
                    .then(data => {
                        analytics.send({ name: 'VOSTOK Transaction Success' });
                        return data;
                    }, (error) => {
                        analytics.send({ name: 'VOSTOK Transaction Error' });
                        return Promise.reject(error);
                    });
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
