(function () {
    'use strict';

    /**
     * @param Base
     * @param user
     * @param {$mdDialog} $mdDialog
     * @return {DexScriptedPair}
     */
    const controller = function (Base, user, $mdDialog) {

        class DexScriptedPair extends Base {

            constructor({ assets }) {
                super();
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
