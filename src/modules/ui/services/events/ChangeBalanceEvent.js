(function () {
    'use strict';

    const factory = function (AppEvent) {

        class ChangeBalanceEvent extends AppEvent {

            constructor(assetId, amount) {
                super();
                /**
                 * @private
                 */
                this.__assetId = assetId;
                /**
                 * @private
                 */
                this.__amount = amount;
            }

            getBalanceDifference(assetId) {
                if (this.__assetId === assetId) {
                    return this.__amount;
                } else {
                    return 0;
                }
            }

        }

        return ChangeBalanceEvent;
    };

    factory.$inject = ['AppEvent'];

    angular.module('app.ui')
        .factory('ChangeBalanceEvent', factory);
})();
