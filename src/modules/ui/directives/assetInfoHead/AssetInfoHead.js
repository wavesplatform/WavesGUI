(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param user
     * @param waves
     * @return {AssetInfoHead}
     */
    const controller = function (Base, $scope, user, waves) {

        const ds = require('data-service');
        const { path } = require('ramda');
        const { STATUS_LIST } = require('@waves/oracle-data');

        class AssetInfoHead extends Base {

            /**
             * @param {object}
             * @type {{this}}
             */
            state;
            /**
             * @type {Signable}
             */
            signable;
            /**
             * @type {number}
             */
            step = 0;
            /**
             * @type {boolean}
             */
            isVerified;
            /**
             * @type {boolean}
             */
            isGateway;
            /**
             * @type {boolean}
             */
            isSuspicious;
            /**
             * @type {string}
             */
            assetName;

            $postLink() {
                waves.node.assets.getAsset(this.assetId).then(asset => {
                    this.assetName = asset.displayName;
                    this.ticker = asset.ticker;
                    $scope.$apply();
                });
                const data = ds.dataManager.getOracleAssetData(this.assetId);
                this.isVerified = path(['status'], data) === STATUS_LIST.VERIFIED;
                this.isGateway = path(['status'], data) === STATUS_LIST.GATEWAY;
                this.isSuspicious = user.scam[this.assetId];
                this.hasLabel = this.isVerified || this.isGateway || this.isSuspicious;

                this.state = { assetId: this.assetId };
            }

            /**
             * @param {Signable} signable
             */
            onFillTxForm(signable) {
                this.signable = signable;
                const { assetId, script } = this.signable.getTxData();
                this.state = { assetId, script };
                this.step++;
            }

            onConfirmBack() {
                this.step--;
            }

        }

        return new AssetInfoHead();
    };

    controller.$inject = ['Base', '$scope', 'user', 'waves'];

    angular.module('app.ui')
        .component('wAssetInfoHead', {
            controller: controller,
            templateUrl: 'modules/ui/directives/assetInfoHead/asset-info-head.html',
            bindings: {
                assetId: '@'
            }
        });
})();
