(function () {
    'use strict';

    const tsUtils = require('ts-utils');
    const { Money } = require('@waves/data-entities');

    /**
     * @param {User} user
     * @return {TokensGeneral}
     */

    const controller = function (user) {

        class TokensGeneral {

            /**
             * {object}
             */
            props = null;

            $postLink() {
                this.typeName = this.props.typeName;
                this.assetName = this.getAssetName(
                    tsUtils.get(this.props, 'amount.asset') ||
                    tsUtils.get(this.props, 'quantity.asset') ||
                    this.props
                );
                this.name = tsUtils.get(this.props, 'amount.asset.name') ||
                            tsUtils.get(this.props, 'quantity.asset.name');

                const amount = tsUtils.get(this.props, 'amount') || tsUtils.get(this.props, 'quantity');
                this.amountParams = {
                    amount: amount instanceof Money ? amount.toFormat() : amount.div(Math.pow(10, this.props.precision))
                };
                this.subheaderParams = {
                    time: this.props.time
                };
                this.reissuable = this.props.reissuable;
                this.reissuableDefined = typeof this.reissuable !== 'undefined';
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

        return new TokensGeneral();
    };

    controller.$inject = [
        'user'
    ];

    angular.module('app.ui').component('wTokensGeneral', {
        bindings: {
            props: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/tokens-general.html',
        controller
    });
})();
