(function () {
    'use strict';

    /**
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @return {LeaseInfo}
     */
    const controller = function ($scope, utils) {

        class LeaseInfo {

            /**
             * @type {Signable}
             */
            signable;
            /**
             * @type {boolean}
             */
            isLeaseIn = false;
            /**
             * @type {boolean}
             */
            isLeaseOut = false;
            /**
             * @type {string}
             */
            address = '';
            /**
             * @type {boolean}
             */
            isActive;


            $postLink() {
                this.transaction = this.signable.getTxData();
                this.isActive = this.transaction.status === 'active';
                const typeName = utils.getTransactionTypeName(this.transaction);

                switch (typeName) {
                    case WavesApp.TRANSACTION_TYPES.EXTENDED.LEASE_OUT:
                        this.isLeaseOut = true;
                        this.address = this.transaction.recipient;
                        break;
                    case WavesApp.TRANSACTION_TYPES.EXTENDED.LEASE_IN:
                        this.isLeaseIn = true;
                        this.address = this.transaction.sender;
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

        return new LeaseInfo();
    };

    controller.$inject = ['$scope', 'utils'];

    angular.module('app.ui').component('wLeaseInfo', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/lease/lease-info.html'
    });
})();
