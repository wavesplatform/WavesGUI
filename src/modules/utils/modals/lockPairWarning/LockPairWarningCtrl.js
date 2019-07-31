(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @return {LockPairWarningCtrl}
     */
    const controller = function (Base, $scope) {

        class LockPairWarningCtrl extends Base {

            constructor({ amountTicker, priceTicker }) {
                super($scope);
                this.amountTicker = amountTicker;
                this.priceTicker = priceTicker;
            }

        }

        return new LockPairWarningCtrl(this);
    };

    controller.$inject = ['Base', '$scope', '$mdDialog'];

    angular.module('app.ui')
        .controller('LockPairWarningCtrl', controller);
})();
