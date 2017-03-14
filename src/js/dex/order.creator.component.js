(function () {
    'use strict';

    function OrderCreatorController() {

        var ctrl = this;

        ctrl.focused = 'buy';

        ctrl.buy = {
            amount: '',
            price: 122
        };

        ctrl.focusOn = function (half) {
            ctrl.focused = half;
        };
    }

    angular
        .module('app.dex')
        .component('wavesDexOrderCreator', {
            controller: OrderCreatorController,
            templateUrl: 'dex/order.creator.component'
        });
})();
