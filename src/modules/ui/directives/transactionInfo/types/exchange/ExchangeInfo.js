(function () {
    'use strict';

    /**
     * @param {app.utils} utils
     * @return {ExchangeInfo}
     */
    const controller = function (utils) {

        class ExchangeInfo {

            /**
             * @type {Signable}
             */
            signable;
            /**
             * @type {Money}
             */
            fee;


            $postLink() {
                this.transaction = this.signable.getTxData();
                this.id = this.transaction.id;
                this.fee = utils.getExchangeFee(this.transaction);
                this.showSellMatcherFee = this.transaction.exchangeType === this.transaction.sellOrder.orderType;
                this.showBuyMatcherFee = this.transaction.exchangeType === this.transaction.buyOrder.orderType;
            }

        }

        return new ExchangeInfo();
    };

    controller.$inject = ['utils'];

    angular.module('app.ui').component('wExchangeInfo', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/exchange/info.html'
    });
})();
