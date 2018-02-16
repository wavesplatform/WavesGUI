(function () {
    'use strict';

    const controller = function (Base, $scope) {

        class TokenBurnModalCtrl extends Base {

            constructor(asset) {
                super($scope);
                /**
                 * @type {number}
                 */
                this.step = 0;
                /**
                 * @type {ExtendedAsset}
                 */
                this.asset = asset;
            }

        }

        return new TokenBurnModalCtrl(this.asset);
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.utils').controller('TokenBurnModalCtrl', controller);
})();
