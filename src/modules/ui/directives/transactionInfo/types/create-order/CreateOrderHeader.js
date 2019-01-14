(function () {
    'use strict';

    /**
     * @param {app.utils} utils
     * @return {ExchangeHeader}
     */
    const controller = function (utils) {

        class ExchangeHeader {

            /**
             * @type {string}
             */
            typeName;
            /**
             * @type {Signable}
             */
            signable;
            /**
             * @type {string}
             */
            signPrice = '–';
            /**
             * @type {string}
             */
            signAmount = '+';


            $postLink() {
                this.transaction = this.signable.getTxData();
                this.typeName = utils.getTransactionTypeName(this.transaction);
                this.totalPrice = utils.getExchangeTotalPrice(this.transaction.amount, this.transaction.price);
                this.signPrice = this.typeName === 'exchange-buy' ? '–' : '+';
                this.signAmount = this.typeName === 'exchange-buy' ? '+' : '–';
            }

        }

        return new ExchangeHeader();
    };

    controller.$inject = ['utils', 'baseAssetService', '$scope'];

    angular.module('app.ui').component('wCreateOrderHeader', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/create-order/createOrderHeader.html'
    });
})();
