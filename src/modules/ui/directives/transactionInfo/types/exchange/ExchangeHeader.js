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

            /**
             * @type {boolean}
             */
            isScamAmount;

            /**
             * @type {boolean}
             */
            isScamPrice;

            $postLink() {
                this.transaction = this.signable.getTxData();
                this.typeName = utils.getTransactionTypeName(this.transaction);
                this.totalPrice = utils.getExchangeTotalPrice(this.transaction.amount, this.transaction.price);
                this.signPrice = this.typeName === 'exchange-buy' ? '–' : '+';
                this.signAmount = this.typeName === 'exchange-buy' ? '+' : '–';
                this.isScamAmount = !!WavesApp.scam[this.transaction.amount.asset];
                this.isScamPrice = !!WavesApp.scam[this.transaction.price.asset];
            }

        }

        return new ExchangeHeader();
    };

    controller.$inject = ['utils', 'baseAssetService', '$scope'];

    angular.module('app.ui').component('wExchangeHeader', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/exchange/header.html'
    });
})();
