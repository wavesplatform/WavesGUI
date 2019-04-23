(function () {
    'use strict';

    /**
     * @param {User} user
     * @return {Transfer}
     */

    const controller = function (user) {

        class Transfer {

            $postLink() {
                this.typeName = this.transaction.typeName;
                this.assetName = this.getAssetName(this.transaction.amount.asset);
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

        return new Transfer();
    };

    controller.$inject = [
        'user'
    ];

    angular.module('app.ui').component('wTransfer', {
        bindings: {
            transaction: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/types/transfer/transfer.html',
        controller
    });
})();
