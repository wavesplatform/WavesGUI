(function () {
    'use strict';

    /**
     * @param {app.utils} utils
     * @return {SponsorshipHeader}
     */
    const controller = function (utils) {

        class SponsorshipHeader {

            /**
             * @type {Signable}
             */
            signable;


            $postLink() {
                this.transaction = this.signable.getTxData();
                this.typeName = utils.getTransactionTypeName(this.transaction);
            }

        }

        return new SponsorshipHeader();
    };

    controller.$inject = ['utils'];

    angular.module('app.ui').component('wSponsorshipHeader', {
        bindings: {
            signable: '<',
            isScam: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/sponsorship/header.html'
    });
})();
