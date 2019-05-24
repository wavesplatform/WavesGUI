(function () {
    'use strict';

    /**
     * @param {BaseAssetService} baseAssetService
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @param $filter
     * @return {TransactionInfoRow}
     */

    const controller = function (Base, utils, $scope, $filter) {

        class TransactionInfoRow extends Base {

            $postLink() {
                this.type = this.transaction.type;
                this.props = {
                    ...this.transaction,
                    time: $filter('date')(this.transaction.timestamp, this.datePattern || 'HH:mm'),
                    isScam: this.isScam
                };

                this.observe('isScam', () => {
                    this.props.isScam = this.isScam;
                    utils.safeApply($scope);
                });
            }

        }

        return new TransactionInfoRow();
    };

    controller.$inject = [
        'Base',
        'utils',
        '$scope',
        '$filter'
    ];

    angular.module('app.ui').component('wTransactionInfoRow', {
        bindings: {
            transaction: '<',
            datePattern: '<',
            isScam: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/transaction-info-row.html',
        controller
    });
})();
