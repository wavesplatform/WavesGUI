(function () {
    'use strict';

    const tsUtils = require('ts-utils');
    const { Money } = require('@waves/data-entities');

    /**
     * @param {User} user
     * @return {Issue}
     */

    const controller = function (user) {

        class Issue {

            /**
             * {object}
             */
            props = null;

            $postLink() {
                this.assetName = this.getAssetName(
                    tsUtils.get(this.props, 'amount.asset') ||
                    tsUtils.get(this.props, 'quantity.asset') ||
                    this.props
                );
                this.name = tsUtils.get(this.props, 'amount.asset.name') ||
                    tsUtils.get(this.props, 'quantity.asset.name');

                const amount = tsUtils.get(this.props, 'amount') || tsUtils.get(this.props, 'quantity');
                this.amount = amount instanceof Money ?
                    amount.toFormat() :
                    amount.div(Math.pow(10, this.props.precision));
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

        return new Issue();
    };

    controller.$inject = [
        'user'
    ];

    angular.module('app.ui').component('wIssue', {
        bindings: {
            props: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/types/issue/issue.html',
        controller
    });
})();
