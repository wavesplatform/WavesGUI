(function () {
    'use strict';

    /**
     * @param {AssetsService} assetsService
     */
    const controller = function (assetsService) {

        class Balance {

            constructor() {
                /**
                 * @type {string}
                 */
                this.assetId = null;
                /**
                 * @type {number}
                 */
                this.precision = null;
            }

            $postLink() {
                if (!this.assetId) {
                    throw new Error('Has no asset id!');
                }

                assetsService.getAssetInfo(this.assetId)
                    .then((info) => {
                        this.precision = info.precision;
                    });
            }

        }

        return new Balance();
    };

    controller.$inject = ['assetsService'];

    angular.module('app.ui')
        .component('wBalance', {
            template: '<span w-nice-number="$ctrl.balance" precision="$ctrl.precision"></span>',
            bindings: {
                balance: '<',
                assetId: '@'
            },
            controller
        });
})();
