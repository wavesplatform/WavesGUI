(function () {
    'use strict';

    function CommunityController($scope, $interval, apiService, applicationContext) {
        var community = this;
        var refreshPromise;
        var REFRESH_DELAY = 10 * 1000;
        var BLOCKS_DEPTH = 50;

        community.candidate = {
            block: 0,
            size: 0
        };
        community.blocks = [];

        refreshData();

        refreshPromise = $interval(refreshData, REFRESH_DELAY);

        $scope.$on('$destroy', function () {
            if (angular.isDefined(refreshPromise)) {
                $interval.cancel(refreshPromise);
                refreshPromise = undefined;
            }
        });

        function refreshData() {
            var blockHeight = applicationContext.blockHeight;

            var endBlock = blockHeight;
            var startBlock = Math.max(1, endBlock - BLOCKS_DEPTH);
            apiService.transactions.unconfirmed()
                .then(function (response) {
                    community.candidate.block = blockHeight + 1;
                    community.candidate.size = response.length;

                    return apiService.blocks.list(startBlock, endBlock);
                })
                .then(function (response) {
                    community.blocks = response;
                });
        }
    }

    CommunityController.$inject = ['$scope', '$interval', 'apiService', 'applicationContext'];

    angular
        .module('app.community')
        .controller('communityController', CommunityController);
})();
