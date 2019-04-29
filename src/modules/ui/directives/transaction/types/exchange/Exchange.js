(function () {
    'use strict';

    /**
     * @param {User} user
     * @param {app.utils} utils
     * @return {Exchange}
     */

    const controller = function (user, utils) {

        class Exchange {

            /**
             * {object}
             */
            props = null;

            $postLink() {
                this.typeName = this.props.typeName;
                this.amountAssetName = this.getAssetName(this.props.amount.asset);
                this.priceAssetName = this.getAssetName(this.props.price.asset);
                this.isScamAmount = !!user.scam[this.props.amount.asset];
                this.isScamPrice = !!user.scam[this.props.price.asset];
                this.amountParams = {
                    sign: this.typeName === 'exchange-buy' ? '+' : '–',
                    amount: this.props.amount.toFormat(),
                    name: this.props.amount.asset.name
                };
                this.priceParams = {
                    sign: this.typeName === 'exchange-buy' ? '-' : '+',
                    amount: utils.getExchangeTotalPrice(this.props.amount, this.props.price),
                    name: this.props.price.asset.name
                };

            }

            /**
             * @param {{id: string, name: string}} asset
             * @return {string}
             */
            getAssetName(asset) {
                try {
                    return !user.scam[asset.id] ? asset.name : '';
                } catch (e) {
                    return '';
                }
            }

        }

        return new Exchange();
    };

    controller.$inject = [
        'user',
        'utils'
    ];

    angular.module('app.ui').component('wExchangeData', {
        bindings: {
            props: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/types/exchange/exchange.html',
        controller
    });
})();
