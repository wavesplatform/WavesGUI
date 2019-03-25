(function () {
    'use strict';


    const controller = function (Base, user, $mdDialog) {

        class DexScriptedPair {

            constructor({ assets }) {
                this.assets = assets;
                this.tradeWithScriptAssets = false;
            }

            confirm() {
                user.setSetting('tradeWithScriptAssets', this.tradeWithScriptAssets);
                $mdDialog.hide();
            }

        }

        return new DexScriptedPair(this.locals);
    };

    controller.$inject = ['Base', 'user', '$mdDialog'];

    angular.module('app.utils').controller('DexScriptedPairCtrl', controller);
})();
