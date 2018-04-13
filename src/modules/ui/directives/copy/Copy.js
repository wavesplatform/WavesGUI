(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param $scope
     * @param {app.utils} utils
     * @param {INotification} notification
     * @param {JQuery} $element
     */
    const controller = function (Base, $scope, utils, notification, $element) {

        class Copy extends Base {

            constructor() {
                super($scope);
                const element = $element.get(0);

                const clipboard = new Clipboard(element, {
                    text: () => $scope.wCopy,
                    container: element
                });

                clipboard.on('success', () => {
                    notification.info({
                        ns: 'app.ui',
                        title: { literal: 'copySuccess' }
                    });
                });

                clipboard.on('error', () => {
                    notification.error({
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

    controller.$inject = ['Base', '$scope', 'utils', 'notification', '$element'];

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
