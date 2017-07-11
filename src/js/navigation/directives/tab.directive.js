(function () {
    'use strict';

    function WavesTabController($scope, dialogService) {
        $scope.isSelected = function () {
            return $scope.pageId === $scope.currentPageId;
        };

        $scope.onClick = function () {
            $scope.onSelect({pageId: $scope.pageId});

            // cleaning unused modal dialog divs, created by previous tab
            dialogService.cleanup();
        };
    }

    function WavesTabLink(scope, element) {
        element.addClass('tabs-radio');
    }

    angular
        .module('app.navigation')
        .directive('wavesTab', function WavesTabDirective() {
            return {
                restrict: 'A',
                controller: ['$scope', 'dialogService', WavesTabController],
                scope: {
                    pageId: '@',
                    caption: '<',
                    onSelect: '&',
                    currentPageId: '<'
                },
                link: WavesTabLink,
                templateUrl: 'navigation/tab.directive'
            };
        });
})();
