(function () {
    'use strict';

    function Notification() {
        this.notice = function (message) {
            angular.element.growl.notice({message});
        };

        this.error = function (message) {
            angular.element.growl.error({message});
        };

        this.warning = function (message) {
            angular.element.growl.warning({message});
        };
    }

    angular
        .module(`app.shared`)
        .service(`notificationService`, Notification);
})();
