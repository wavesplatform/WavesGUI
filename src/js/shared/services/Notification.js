(function () {
    'use strict';

    angular
        .module('app.shared')
        .service('notificationService', [function () {
            this.notice = function (message) {
                angular.element.growl.notice({message: message});
            };

            this.error = function (message) {
                angular.element.growl.error({message: message});
            };

            this.warning = function (message) {
                angular.element.growl.warning({message: message});
            };
        }]);
})();
