(function () {
    'use strict';

    /**
     * @param {Waves} waves
     * @return {Transaction}
     */

    const controller = function (waves) {

        class SetAssetScript {

            /**
             * {object}
             */
            props = null;

            $postLink() {
                if (this.props.assetId) {
                    waves.node.assets.getAsset(this.props.assetId).then(asset => {
                        this.name = asset.name;
                    });
                }
            }

        }

        return new SetAssetScript();
    };

    controller.$inject = [
        'waves'
    ];

    angular.module('app.ui').component('wSetAssetScript', {
        bindings: {
            props: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/types/set-asset-script/set-asset-script.html',
        controller
    });
})();
