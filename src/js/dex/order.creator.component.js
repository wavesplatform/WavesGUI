(function () {
    'use strict';

    function OrderCreatorController() {

        var ctrl = this;

        ctrl.focused = 'buy';

        ctrl.buy = {
            amount: '',
            price: null,
            feePercentage: 0.001
        };

        ctrl.sell = {
            amount: '',
            price: null,
            feePercentage: 0.001
        };

        ctrl.focusOn = function (half) {
            ctrl.focused = half;
        };
    }

    angular
        .module('app.dex')
        .component('wavesDexOrderCreator', {
            controller: OrderCreatorController,
            bindings: {
                pair: '<'
            },
            templateUrl: 'dex/order.creator.component'
        });
})();
