(function () {
    'use strict';

    const factory = function (EventComponent) {

        class BalanceComponent extends EventComponent {

            constructor(data) {
                super(data);
                this.amount = data.amount;
                this.assetId = data.assetId;
            }

            getBalanceDifference(assetId) {
                if (this.assetId === assetId) {
                    return this.amount;
                } else {
                    return 0;
                }
            }

        }

        return BalanceComponent;
    };

    factory.$inject = ['EventComponent'];

    angular.module('app')
        .factory('BalanceComponent', factory);
})();
