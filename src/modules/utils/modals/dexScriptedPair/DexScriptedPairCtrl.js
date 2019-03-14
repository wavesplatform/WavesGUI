(function () {
    'use strict';


    const controller = function (Base, $scope) {

        class DexScriptedPair extends Base {

            constructor() {
                super($scope);

                /**
                 * @type {boolean}
                 */
                this.assetId1 = null;
                this.assetId2 = null;

            }

        }

        return new DexScriptedPair();
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.utils').controller('DexScriptedPairCtrl', controller);
})();
