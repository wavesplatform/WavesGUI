(function () {
    'use strict';

    const REFRESH_DELAY = 10 * 1000;
    const BLOCKS_DEPTH = 50;


    class CommunityController {

        constructor($scope, $interval, apiService, applicationContext) {

            this.apiService = apiService;
            this.applicationContext = applicationContext;

            this.candidate = {
                block: 0,
                size: 0
            };
            this.blocks = [];

            this.refreshData();

            let $intervalId = $interval(this.refreshData.bind(this), REFRESH_DELAY);

            $scope.$on('$destroy', function () {
                if (angular.isDefined($intervalId)) {
                    $interval.cancel($intervalId);
                    $intervalId = undefined;
                }
            });
        }

        refreshData() {
            const blockHeight = this.applicationContext.blockHeight;

            const endBlock = blockHeight;
            const startBlock = Math.max(1, endBlock - BLOCKS_DEPTH);

            this.apiService.transactions.unconfirmed()
                .then((response) => {
                    this.candidate.block = blockHeight + 1;
                    this.candidate.size = response.length;

                    return this.apiService.blocks.list(startBlock, endBlock);
                })
                .then((response) => {
                    this.blocks = response;
                });
        }
    }

    CommunityController.$inject = ['$scope', '$interval', 'apiService', 'applicationContext'];

    angular
        .module('app.community')
        .controller('communityController', CommunityController);
})();
