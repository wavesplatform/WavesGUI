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
                this.typeName = this.props.typeName;
                this.subheaderParams = {
                    time: this.props.time
                };
                if (this.props.assetId) {
                    waves.node.assets.getAsset(this.props.assetId).then(asset => {
                        this.subheaderParams.name = asset.name;
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
