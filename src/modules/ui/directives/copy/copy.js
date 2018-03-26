(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param $scope
     * @param {app.utils} utils
     * @param {NotificationManager} notificationManager
     * @param {JQuery} $element
     */
    const controller = function (Base, $scope, utils, notificationManager, $element) {

        class Copy extends Base {

            constructor() {
                super($scope);
                const clipboard = new Clipboard($element.get(0), {
                    text: () => $scope.wCopy,
                    container: $element.get(0)
                });

                clipboard.on('success', () => {
                    notificationManager.info({
                        ns: 'app.ui',
                        title: { literal: 'copySuccess' }
                    });
                });

                clipboard.on('error', () => {
                    notificationManager.error({
                        ns: 'app.ui',
                        title: { literal: 'copyError' }
                    });
                });

                this.signals.destroy.once(() => {
                    clipboard.destroy();
                });
            }

        }

        return new Copy();
    };

    controller.$inject = ['Base', '$scope', 'utils', 'notificationManager', '$element'];

    /**
     * @return {*}
     */
    const directive = function () {
        return {
            restrict: 'A',
            priority: 100,
            scope: {
                wCopy: '<'
            },
            controller
        };
    };

    directive.$inject = [];

    angular.module('app.ui').directive('wCopy', directive);
})();
