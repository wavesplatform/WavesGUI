(function () {
    'use strict';

    function WavesDialogController($scope) {
        $scope.isError = $scope.isError || false;
        $scope.closeable = $scope.closeable || true;
        $scope.okButtonCaption = $scope.okButtonCaption || 'OK';
        $scope.cancelButtonCaption = $scope.cancelButtonCaption || 'CANCEL';

        var imageSuffix = $scope.isError ? '-danger' : '';
        $scope.image = 'modal-header' + imageSuffix;
        if (!$scope.closeable)
            $scope.image = 'modal-reader-round';

        $scope.image += '.svg';

        $scope.showButtons = function () {
            return $scope.dialogOk || $scope.dialogCancel;
        };

        $scope.onOk = function () {
            if ($scope.dialogOk)
                $scope.dialogOk();

            $.modal.close();
        }

        $scope.onCancel = function () {
            if ($scope.dialogCancel)
                $scope.dialogCancel();

            $.modal.close();
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
                controller: ['$scope', WavesDialogController],
                transclude: true,
                scope: {
                    closeable: '<',
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
                    '<div class="wPop-content-buttons" ng-show="showButtons()">' +
                        '<button class="wButton fade tooltip-1" ng-class="[{wButtonDanger: isError}]" title="Click here to proceed with the account removal." ng-click="onOk()">{{::okButtonCaption}}</button>' +
                        '<span class="divider-2"></span>' +
                        '<button class="wButton fade" ng-class="[{wButtonDanger: isError}]" ng-click="onCancel()">{{::cancelButtonCaption}}</button>' +
                    '</div>'
            }
        });
})();
