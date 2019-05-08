(function () {
    'use strict';

    const factory = function (BaseNotificationManager) {
        return new BaseNotificationManager({
            templateUrl: 'modules/app/services/notification/templates/user-notification.html',
            queueLimit: 1,
            defaultDelay: -1
        });
    };

    factory.$inject = ['BaseNotificationManager'];

    angular.module('app').factory('userNotification', factory);
})();
