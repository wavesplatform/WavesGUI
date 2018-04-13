(function () {
    'use strict';

    const factory = function (BaseNotificationManager) {
        return new BaseNotificationManager({
            templateUrl: 'modules/app/services/notification/templates/notification.html',
            queueLimit: 5,
            defaultDelay: 3000
        });
    };

    factory.$inject = ['BaseNotificationManager'];

    angular.module('app').factory('notification', factory);
})();
