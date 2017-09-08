(function () {
    'use strict';

    const controller = function ($element, $scope) {

        const ASSET_IMAGES_MAP = {
            waves: '/img/waves.svg'
        };

        class AssetCtrl {

            constructor() {
                /**
                 * @type {Object}
                 */
                this.asset = null;
                /**
                 * @type {null}
                 */
                this.isAdd = false;
                /**
                 * @type {null}
                 */
                this.logo = null;
            }

            $postLink() {
                $scope.$$postDigest(() => {
                    const lowerName = this.asset.name.toLowerCase();
                    if (lowerName in ASSET_IMAGES_MAP) {
                        $element.find('.logo')
                            .css('background-image', `url(${ASSET_IMAGES_MAP[lowerName]})`);
                    } else {
                        const letter = this.asset.name.charAt(0).toUpperCase();
                        $element.find('.logo')
                            .text(letter)
                            .css('background-color', '#FF9933');
                    }
                });
            }

        }

        return new AssetCtrl();
    };

    controller.$inject = ['$element', '$scope'];

    angular.module('app.wallet.assets').component('wAsset', {
        bindings: {
            asset: '<',
            onClick: '&'
        },
        templateUrl: 'modules/wallet/modules/assets/directives/asset/asset.html',
        controller: controller
    });
})();
