(function () {
    'use strict';

    /**
     * @param {Waves} waves
     * @return {Issue}
     */

    const controller = function (waves) {

        const { propEq } = require('ramda');

        class Data {

            /**
             * {object}
             */
            props = null;

            $postLink() {
                if (this.props.typeName === 'data-vote') {
                    const assetId = this.props.data.find(propEq('key', 'assetId')).value;
                    waves.node.assets.getAsset(assetId).then(asset => {
                        this.assetName = asset.displayName;
                    });
                }
            }


        }

        return new Data();
    };

    controller.$inject = ['waves'];

    angular.module('app.ui').component('wData', {
        bindings: {
            props: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transaction/types/data/data.html'
    });
})();
