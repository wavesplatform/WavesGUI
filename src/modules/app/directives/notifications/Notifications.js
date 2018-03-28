(function () {
    'use strict';

    /**
     * @param Base
     * @param $element
     * @param {NotificationManager} notificationManager
     * @return {Notifications}
     */
    const controller = function (Base, $element, notificationManager) {

        if (controller.instance) {
            throw new Error('There must be only one instance of Notifications component at a time');
        }

        class Notifications extends Base {

            constructor() {
                super();
                this.receive(notificationManager.changeSignal, this._onChangeNotifications, this);
                this._onChangeNotifications(notificationManager.getActiveNotificationsList());
            }

            $onDestroy() {
                controller.instance = null;
            }

            _onChangeNotifications(list) {
                $element.children().detach().end().append(list.map(({ $element }) => $element));
            }

        }

        controller.instance = new Notifications();
        return controller.instance;
    };

    controller.$inject = ['Base', '$element', 'notificationManager'];

    angular.module('app').component('wNotifications', {
        bindings: {},
        transclude: false,
        controller
    });
})();
