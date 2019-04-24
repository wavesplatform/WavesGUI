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
                this.typeName = this.props.typeName;
                this.sponsorshipFee = this.props.minSponsoredAssetFee;
                this.assetName = this.getAssetName(
                    tsUtils.get(this.props, 'minSponsoredAssetFee.asset')
                );
                this.time = this.props.time;
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
