(function () {
    'use strict';

    /**
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @param {Waves} waves
     * @param Base
     * @return {LeaseInfo}
     */
    const controller = function ($scope, utils, waves, Base) {

        class LeaseInfo extends Base {

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
            confirmed;


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

                const applyConfirmed = () => this.getId()
                    .then(id => {
                        this.id = id;
                        waves.node.transactions.getAlways(this.id)
                            .then(res => {
                                this.transaction = res;
                                this.isActive = this.transaction.status === 'active';
                                $scope.$apply();
                            });
                    });

                if (this.confirmed) {
                    applyConfirmed();
                } else {
                    this.observeOnce('confirmed', applyConfirmed);
                }
            }

            getId() {
                return this.transaction.id ? Promise.resolve(this.transaction.id) : this.signable.getId();
            }

        }

        return new LeaseInfo();
    };

    controller.$inject = ['$scope', 'utils', 'waves', 'Base'];

    angular.module('app.ui').component('wLeaseInfo', {
        bindings: {
            signable: '<',
            confirmed: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/lease/lease-info.html'
    });
})();
