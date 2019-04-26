(function () {
    'use strict';

    const controller = function () {

        class Lease {

            /**
             * {object}
             */
            props = null;

            $postLink() {
                this.typeName = this.props.typeName;
                this.subheaderParams = {
                    time: this.props.time,
                    address: this.props.shownAddress
                };
                this.amountParams = {
                    amount: this.props.amount.toFormat(),
                    name: this.props.amount.asset.name
                };
            }

        }

        return new Lease();
    };

    angular.module('app.ui').component('wLease', {
        bindings: {
            props: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/types/lease/lease.html',
        controller
    });
})();
