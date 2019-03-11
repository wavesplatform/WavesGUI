(function () {
    'use strict';

    /**
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @return {MassTransferInfo}
     */
    const controller = function ($scope, utils) {

        class MassTransferInfo {

            /**
             * @type {Signable}
             */
            signable;
            /**
             * @type {boolean}
             */
            isSend = false;
            /**
             * @type {boolean}
             */
            isReceive = false;
            /**
             * @type {boolean}
             */
            showAllTX = false;
            /**
             * @type {boolean}
             */
            expandList = false;


            $postLink() {
                this.transaction = this.signable.getTxData();
                this.attachment = utils.bytesToSafeString(this.transaction.attachment);
                const typeName = utils.getTransactionTypeName(this.transaction);

                switch (typeName) {
                    case WavesApp.TRANSACTION_TYPES.EXTENDED.MASS_SEND:
                        this.isSend = true;
                        break;
                    case WavesApp.TRANSACTION_TYPES.EXTENDED.MASS_RECEIVE:
                        this.isReceive = true;
                        break;
                    default:
                        break;
                }

                (this.transaction.id ? Promise.resolve(this.transaction.id) : this.signable.getId())
                    .then(id => {
                        this.id = id;
                        $scope.$apply();
                    });
            }

        }

        return new MassTransferInfo();
    };

    controller.$inject = ['$scope', 'utils'];

    angular.module('app.ui').component('wMassTransferInfo', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/mass-transfer/info.html'
    });
})();
