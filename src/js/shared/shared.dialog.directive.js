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
        if (!$scope.closeable)
            $scope.image = 'modal-header-round';

        $scope.image += '.svg';

        $scope.onOk = function () {
            var shouldClose;

            if ($scope.dialogOk)
                shouldClose = $scope.dialogOk();

            if (angular.isUndefined(shouldClose) || shouldClose !== false)
                dialogService.close();
        };

        $scope.onCancel = function () {
            if ($scope.dialogCancel)
                $scope.dialogCancel();

            dialogService.close();
        };
    }

    function WavesDialogLink(scope, element, attrs, controller) {
        element.addClass('wavesPop');

        if (!scope.global)
            element.addClass('recyclable');
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
                    global: '=?'
                },
                link: WavesDialogLink,
                template: '<img class="wPop-header" ng-src="img/{{image}}" />' +
                    '<div class="wavesPop-content" ng-transclude></div>' +
                    '<div class="wPop-content-buttons" ng-show="showButtons">' +
                        '<button class="wButton fade tooltip-1" ng-class="[{wButtonDanger: isError}]" ' +
                            'title="{{::tooltip}}" ng-click="onOk()" ng-disabled="!okButtonEnabled">' +
                            '{{::okButtonCaption}}</button>' +
                        '<span class="divider-2" ng-if="cancelButtonVisible"></span>' +
                        '<button ng-if="cancelButtonVisible" class="wButton fade" ' +
                            'ng-class="[{wButtonDanger: isError}]" ng-click="onCancel()">{{::cancelButtonCaption}}' +
                        '</button>' +
                    '</div>'
            };
        });
})();
