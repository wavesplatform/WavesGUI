(function () {
    'use strict';

    function WavesDialogController($scope, dialogService) {
        $scope.isError = $scope.isError || false;
        $scope.cancelButtonVisible = $scope.cancelButtonVisible || true;
        $scope.closeable = $scope.closeable || true;
        $scope.okButtonCaption = $scope.okButtonCaption || 'OK';
        $scope.cancelButtonCaption = $scope.cancelButtonCaption || 'CANCEL';
        $scope.showButtons = $scope.showButtons || true;

        var imageSuffix = $scope.isError ? '-danger' : '';
        $scope.image = 'modal-header' + imageSuffix;
        if (!$scope.closeable)
            $scope.image = 'modal-header-round';

        $scope.image += '.svg';

        $scope.onOk = function () {
            if ($scope.dialogOk)
                $scope.dialogOk();

            dialogService.close();
        }

        $scope.onCancel = function () {
            if ($scope.dialogCancel)
                $scope.dialogCancel();

            dialogService.close();
        }
    }

    function WavesDialogLink(scope, element, attrs, controller) {
        element.addClass('wavesPop');
    }

    angular
        .module('app.shared')
        .directive('wavesDialog', function WavesDialogDirective() {

            return {
                restrict: 'A',
                controller: ['$scope', 'dialogService', WavesDialogController],
                transclude: true,
                scope: {
                    closeable: '<',
                    cancelButtonVisible: '<',
                    showButtons: '<',
                    dialogOk: '&onDialogOk',
                    dialogCancel: '&onDialogCancel',
                    dialogClose: '&onDialogClose',
                    okButtonCaption: '@',
                    cancelButtonCaption: '@',
                    isError: '<'
                },
                link: WavesDialogLink,
                template: '<img class="wPop-header" ng-src="img/{{image}}" />' +
                    '<div class="wavesPop-content" ng-transclude></div>' +
                    '<div class="wPop-content-buttons" ng-show="showButtons">' +
                        '<button class="wButton fade tooltip-1" ng-class="[{wButtonDanger: isError}]" title="Click here to proceed with the account removal." ng-click="onOk()">{{::okButtonCaption}}</button>' +
                        '<span class="divider-2" ng-if="cancelButtonVisible"></span>' +
                        '<button ng-if="cancelButtonVisible" class="wButton fade" ng-class="[{wButtonDanger: isError}]" ng-click="onCancel()">{{::cancelButtonCaption}}</button>' +
                    '</div>'
            }
        });
})();
