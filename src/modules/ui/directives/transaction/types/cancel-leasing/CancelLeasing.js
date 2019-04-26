(function () {
    'use strict';

    const controller = function () {

        class CancelLeasing {

            /**
             * {object}
             */
            props = null;

            $postLink() {
                this.typeName = this.props.typeName;
                this.subheaderParams = {
                    time: this.props.time,
                    transactionId: this.props.leaseId
                };
                this.amountParams = {
                    amount: this.props.lease.amount.toFormat(),
                    name: this.props.lease.amount.asset.name
                };
            }

        }

        return new CancelLeasing();
    };

    angular.module('app.ui').component('wCancelLeasing', {
        bindings: {
            props: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/types/cancel-leasing/cancel-leasing.html',
        controller
    });
})();
