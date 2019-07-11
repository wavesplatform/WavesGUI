(function () {
    'use strict';

    const tsUtils = require('ts-utils');

    /**
     * @param {User} user
     * @return {Sponsorship}
     */

    const controller = function (user) {

        class Sponsorship {

            /**
             * {object}
             */
            props = null;

            $postLink() {
                this.assetName = this.getAssetName(
                    tsUtils.get(this.props, 'minSponsoredAssetFee.asset')
                );
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

        return new Sponsorship();
    };

    controller.$inject = [
        'user'
    ];

    angular.module('app.ui').component('wSponsorship', {
        bindings: {
            props: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/types/sponsorship/sponsorship.html',
        controller
    });
})();
