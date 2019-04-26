(function () {
    'use strict';

    const controller = function (Base, $scope, user, waves) {

        const ds = require('data-service');
        const { path } = require('ramda');
        const { STATUS_LIST } = require('@waves/oracle-data');

        class SetAssetScriptModalCtrl extends Base {

            /**
             * @param {object}
             * @type {null}
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

            constructor(assetId) {
                super($scope);
                waves.node.assets.getAsset(assetId).then(asset => {
                    this.assetName = asset.displayName;
                    this.ticker = asset.ticker;
                    $scope.$apply();
                });
                const data = ds.dataManager.getOracleAssetData(assetId);
                this.isVerified = path(['status'], data) === STATUS_LIST.VERIFIED;
                this.isGateway = path(['status'], data) === 3;
                this.isSuspicious = user.scam[assetId];
                this.hasLabel = this.isVerified || this.isGateway || this.isSuspicious;

                this.state = { assetId };
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

        return new SetAssetScriptModalCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope', 'user', 'waves'];

    angular.module('app.utils').controller('SetAssetScriptModalCtrl', controller);
})();
