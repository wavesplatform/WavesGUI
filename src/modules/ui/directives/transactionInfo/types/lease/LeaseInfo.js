(function () {
    'use strict';

    /**
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @param {Waves} waves
     * @return {LeaseInfo}
     */
    const controller = function ($scope, utils, waves) {

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
            /**
             * @type {boolean}
             */
            inBlockChain;


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
                    .then(async id => {
                        this.id = id;
                        this.inBlockChain = await waves.node.transactions.getAlways(this.id)
                            .then(() => true)
                            .catch(() => false);

                        $scope.$apply();
                    });


            }

        }

        return new LeaseInfo();
    };

    controller.$inject = ['$scope', 'utils', 'waves'];

    angular.module('app.ui').component('wLeaseInfo', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/lease/lease-info.html'
    });
})();
