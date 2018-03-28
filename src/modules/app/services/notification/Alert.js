(function () {
    'use strict';

    const factory = function (BaseNotificationManager) {
        return new BaseNotificationManager({
            templateUrl: 'modules/app/services/notification/templates/alert.html',
            queueLimit: 3,
            defaultDelay: -1
        });
    };

    factory.$inject = ['BaseNotificationManager'];

    angular.module('app').factory('alert', factory);
})();
