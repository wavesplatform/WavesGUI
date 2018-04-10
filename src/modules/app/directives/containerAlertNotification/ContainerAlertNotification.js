(function () {
    'use strict';

    /**
     * @param Base
     * @param $element
     * @param {$injector} $injector
     * @return {ContainerAlertNotification}
     */
    const controller = function (Base, $element, $injector) {


        class ContainerAlertNotification extends Base {

            constructor() {
                super();
                /**
                 * @type {string}
                 */
                this.type = null;
            }

            $postLink() {
                if (!this.type) {
                    throw new Error('Can\'t find type!');
                }

                /**
                 * @type {INotification}
                 */
                const notification = $injector.get(this.type);
                this.receive(notification.changeSignal, this._onChangeNotifications, this);
                this._onChangeNotifications(notification.getActiveNotificationsList());

            }

            /**
             * @param list
             * @private
             */
            _onChangeNotifications(list) {
                $element.children().detach().end().append(list.map(({ $element }) => $element));
            }

        }

        return new ContainerAlertNotification();

    };

    controller.$inject = ['Base', '$element', '$injector'];

    angular.module('app').component('wContainerAlertNotification', {
        bindings: {
            type: '@'
        },
        transclude: false,
        controller
    });
})();
