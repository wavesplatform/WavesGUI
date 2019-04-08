(function () {
    'use strict';

    /**
     *
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @return {TransactionInfoCtrl}
     */
    const controller = function (Base, $scope) {

        const analytics = require('@waves/event-sender');
        const { SIGN_TYPE } = require('@waves/signature-adapter');

        const ANALYTICS_TX_NAMES = {
            [SIGN_TYPE.CREATE_ORDER]: 'Create order',
            [SIGN_TYPE.ISSUE]: 'Token Generation',
            [SIGN_TYPE.TRANSFER]: 'Transfer',
            [SIGN_TYPE.REISSUE]: 'Reissue',
            [SIGN_TYPE.BURN]: 'Burn Token',
            [SIGN_TYPE.EXCHANGE]: 'Exchange',
            [SIGN_TYPE.LEASE]: 'Leasing',
            [SIGN_TYPE.CANCEL_LEASING]: 'Cancel Leasing',
            [SIGN_TYPE.CREATE_ALIAS]: 'Create Alias',
            [SIGN_TYPE.MASS_TRANSFER]: 'Mass Transfer',
            [SIGN_TYPE.DATA]: 'Data',
            [SIGN_TYPE.SET_SCRIPT]: 'Set Script',
            [SIGN_TYPE.SPONSORSHIP]: 'Sponsorship',
            [SIGN_TYPE.SET_ASSET_SCRIPT]: 'Set Asset Script'
        };

        class TransactionInfoCtrl extends Base {

            constructor() {
                super($scope);
                /**
                 * @type {Signable}
                 */
                this.signable = null;
            }

            $postLink() {
                if (!this.signable) {
                    throw new Error('Has no signable!');
                }
                const name = `${this.getEventName(this.signable)} Transaction Info Show`;
                analytics.send({ name, target: 'ui' });
            }

            getEventName(data) {
                if (data.type) {
                    return data.type in ANALYTICS_TX_NAMES ? ANALYTICS_TX_NAMES[data.type] : 'Unknown';
                } else {
                    return ANALYTICS_TX_NAMES[SIGN_TYPE.CREATE_ORDER];
                }
            }

        }

        return new TransactionInfoCtrl();
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.ui').component('wTransactionInfo', {
        bindings: {
            signable: '<',
            isConfirm: '<'
        },
        templateUrl: 'modules/ui/directives/transactionInfo/transaction-info.html',
        scope: false,
        controller
    });
})();
