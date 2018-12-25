(function () {
    'use strict';

    /**
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @return {TransferInfo}
     */
    const controller = function ($scope, utils) {

        class TransferInfo {

            /**
             * @type {Signable}
             */
            signable;
            /**
             * @type {boolean}
             */
            isReceive = false;
            /**
             * @type {boolean}
             */
            isSend = false;
            /**
             * @type {boolean}
             */
            isSelf = false;
            /**
             * @type {boolean}
             */
            isSponsor = false;


            $postLink() {
                this.transaction = this.signable.getTxData();
                const typeName = utils.getTransactionTypeName(this.transaction);
                switch (typeName) {
                    case WavesApp.TRANSACTION_TYPES.EXTENDED.SEND:
                        this.isSend = true;
                        break;
                    case WavesApp.TRANSACTION_TYPES.EXTENDED.RECEIVE:
                        this.isReceive = true;
                        break;
                    case WavesApp.TRANSACTION_TYPES.EXTENDED.SPONSORSHIP_FEE:
                        this.isSponsor = true;
                        break;
                    default:
                        break;
                }
                this.signable.getId().then(id => {
                    this.id = id;
                    $scope.$apply();
                });
            }

        }

        return new TransferInfo();
    };

    controller.$inject = ['$scope', 'utils'];

    angular.module('app.ui').component('wTransferInfo', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/transfer/transfer-info.html'
    });
})();
