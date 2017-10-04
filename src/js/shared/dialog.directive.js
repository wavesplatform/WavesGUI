(function () {
    'use strict';

    function WavesDialogController($scope, dialogService) {
        var defaults = {
            isError: false,
            cancelButtonVisible: true,
            closeable: true,
            showButtons: true,
            okButtonCaption: 'OK',
            okButtonEnabled: true,
            cancelButtonCaption: 'CANCEL'
        };

        _.defaults($scope, defaults);

        var imageSuffix = $scope.isError ? '-danger' : '';
        $scope.image = 'modal-header' + imageSuffix;
        if (!$scope.closeable) {
            $scope.image = 'modal-header-round';
        }

        $scope.image += '.svg';

        $scope.onOk = function () {
            var shouldClose;

            if ($scope.dialogOk) {
                shouldClose = $scope.dialogOk();
            }

            if (angular.isUndefined(shouldClose) || shouldClose !== false) {
                dialogService.close();
            }
        };

        $scope.onCancel = function () {
            if ($scope.dialogCancel) {
                $scope.dialogCancel();
            }

            dialogService.close();
        };
    }

    function WavesDialogLink(scope, element) {
        element.addClass('wavesPop');

        if (!scope.global) {
            element.addClass('recyclable');
        }
    }

    angular
        .module('app.shared')
        .directive('wavesDialog', function WavesDialogDirective() {

            return {
                restrict: 'A',
                controller: ['$scope', 'dialogService', WavesDialogController],
                transclude: true,
                scope: {
                    closeable: '=?',
                    cancelButtonVisible: '=?',
                    showButtons: '=?',
                    tooltip: '=?',
                    dialogOk: '&onDialogOk',
                    dialogCancel: '&onDialogCancel',
                    okButtonCaption: '@',
                    okButtonEnabled: '=?',
                    cancelButtonCaption: '@',
                    isError: '=?',
                    global: '=?',
                    noSupportLink: '=?'
                },
                link: WavesDialogLink,
                templateUrl: 'shared/dialog.directive'
            };
        });
})();
