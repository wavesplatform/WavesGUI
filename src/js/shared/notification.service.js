(function () {
    'use strict';

    var DELAY = 500;

    function debounce(notifier) {
        var lastCalls = {};
        return function (message) {
            var now = Date.now();
            lastCalls[message] = lastCalls[message] || 0;
            if (lastCalls[message] + DELAY < now) {
                lastCalls[message] = now;
                notifier(message);
            }
        };
    }

    angular
        .module('app.shared')
        .service('notificationService', [function () {
            this.notice = debounce(function (message) {
                angular.element.growl.notice({message : message});
            });

            this.error = debounce(function (message) {
                angular.element.growl.error({message : message});
            });

            this.warning = debounce(function (message) {
                angular.element.growl.warning({message : message});
            });
        }]);
})();
