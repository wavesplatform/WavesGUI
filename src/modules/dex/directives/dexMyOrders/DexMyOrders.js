(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @param {User} user
     * @return {DexMyOrders}
     */
    const controller = function (Base, waves, user, createPoll) {

        class DexMyOrders extends Base {

            constructor() {
                super();

                createPoll(this, this._getOrders, 'orders', 5000);
                window.$ctrl = this; // TODO! Remove!. Author Tsigel at 29/11/2017 09:33
            }

            _getOrders() {
                return user.getSeed().then((seed) => waves.matcher.getOrders(seed.keyPair));
            }

        }

        return new DexMyOrders();
    };

    controller.$inject = ['Base', 'waves', 'user', 'createPoll'];

    angular.module('app.dex').component('wDexMyOrders', {
        bindings: {},
        templateUrl: 'modules/dex/directives/dexMyOrders/myOrders.html',
        controller
    });
})();
