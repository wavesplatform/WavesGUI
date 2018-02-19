(function () {
    'use strict';

    /**
     * @param {app.utils} utils
     * @param {NotificationManager} notificationManager
     * @return {*}
     */
    const directive = function (utils, notificationManager) {
        return {
            restrict: 'A',
            priority: 100,
            scope: false,
            compile: function ($element, $attrs) {
                return function ($scope, $element) {

                    const destroy = new tsUtils.Signal();
                    const stop = $scope.$on('$destroy', () => {
                        destroy.dispatch();
                        stop();
                    });

                    const param = utils.parseAngularParam($attrs.wCopy, $scope, destroy);
                    const clipboard = new Clipboard($element.get(0), {
                        text: () => param.value,
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

                    destroy.once(() => {
                        clipboard.destroy();
                    });

                };
            }
        };
    };

    directive.$inject = ['utils', 'notificationManager'];

    angular.module('app.ui').directive('wCopy', directive);
})();
