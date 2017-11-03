(function () {
    'use strict';

    const DEFAULT_DELAY = 3000;
    const NOTIFICATIONS_LIMIT = 5;

    /**
     * @param $compile
     * @param $q
     * @param $rootScope
     * @param {TimeLine} timeLine
     * @return {NotificationManager}
     */
    const factory = function ($compile, $q, $rootScope, timeLine) {

        class NotificationManager {

            constructor() {
                this._queue = [];
                this._list = [];
                this.changeSignal = new tsUtils.Signal();
            }


            /**
             * @param {INotificationObj} notificationObj
             * @param {number} [delay]
             */
            info(notificationObj, delay) {
                return this._push('info', notificationObj, delay);
            }

            /**
             * @param {INotificationObj} notificationObj
             * @param {number} [delay]
             */
            success(notificationObj, delay) {
                return this._push('success', notificationObj, delay);
            }

            /**
             * @param {INotificationObj} notificationObj
             * @param {number} [delay]
             */
            warn(notificationObj, delay) {
                return this._push('warn', notificationObj, delay);
            }

            /**
             * @param {INotificationObj} notificationObj
             * @param {number} [delay]
             */
            error(notificationObj, delay) {
                return this._push('error', notificationObj, delay);
            }

            /**
             * @param {string} type
             * @param {INotificationObj} notificationObj
             * @param {number} [delay]
             * @return {Promise}
             * @private
             */
            _push(type, notificationObj, delay) {
                const defer = $q.defer();
                this._queue.push([defer, type, notificationObj, delay]);
                this._run();
                return defer.promise;
            }

            _run() {
                if (this._queue.length) {
                    if (this._list.length < NOTIFICATIONS_LIMIT) {
                        const args = this._queue.shift();
                        this._create.apply(this, args);
                        this._run();
                    }
                }
            }

            /**
             * @param defer
             * @param {string} type
             * @param {INotificationObj} notificationObj
             * @param {number} [delay]
             * @return {null}
             * @private
             */
            _create(defer, type, notificationObj, delay = DEFAULT_DELAY) {

                const $scope = $rootScope.$new(true);
                $scope.$on('$destroy', defer.resolve);

                const element = this._buildNotification($scope, type, notificationObj);

                const notification = {
                    promise: defer.promise,
                    element: element,
                    destroy: () => {
                        if (!notification.isDestroyed) {
                            $scope.$destroy();
                            this._remove(notification);
                            notification.isDestroyed = true;
                        }
                    }
                };

                $scope.close = () => notification.destroy();
                timeLine.timeout(() => notification.destroy(), delay);

                if (notificationObj.action) {
                    const callback = notificationObj.action.callback;
                    $scope.doAction = () => {
                        notification.destroy();
                        callback && callback();
                    };
                }

                this._list.push(notification);
                this._dispatch();
            }

            _remove(notification) {
                for (let i = 0; i < this._list.length; i++) {
                    if (this._list[i] === notification) {
                        this._list.splice(i, 1);
                        this._dispatch();
                        this._run();
                        break;
                    }
                }
            }

            _dispatch() {
                this.changeSignal.dispatch(this._list.map((item) => item.element));
            }

            /**
             *
             * @param $scope
             * @param {string} type
             * @param {INotificationObj} notificationObj
             * @return {*}
             * @private
             */
            _buildNotification($scope, type, notificationObj) {
                return $compile(`
                    <div w-i18n-ns="${notificationObj.ns}" class="notification ${type}">
                        <div class="icon-close" ng-click="close()"></div>
                        <div>${this._getTitleContent(notificationObj)}</div>
                        <div>${this._getBodyContent(notificationObj)}</div>
                        <div><span ng-click="doAction()">${this._getActionContent(notificationObj)}</span></div>
                    </div>
                `)($scope);
            }

            /**
             * @param {INotificationObj} notificationObj
             * @return {string}
             * @private
             */
            _getTitleContent(notificationObj) {
                if (notificationObj.title) {
                    const literal = notificationObj.title.literal;
                    const params = JSON.stringify(notificationObj.title.params);
                    return `<w-i18n class="headline-3 basic-900" params=${params}>${literal}</w-i18n>`;
                } else {
                    return '';
                }
            }

            /**
             * @param {INotificationObj} notificationObj
             * @return {string}
             * @private
             */
            _getBodyContent(notificationObj) {
                if (notificationObj.body) {
                    const literal = notificationObj.body.literal;
                    const params = JSON.stringify(notificationObj.body.params);
                    return `<w-i18n class="footnote basic-700" params=${params}>${literal}</w-i18n>`;
                } else {
                    return '';
                }
            }

            /**
             * @param {INotificationObj} notificationObj
             * @return {string}
             * @private
             */
            _getActionContent(notificationObj) {
                if (notificationObj.action) {
                    const literal = notificationObj.action.literal;
                    const params = JSON.stringify(notificationObj.action.params);
                    return `<w-i18n class="footnote-2 submit-300" params=${params}>${literal}</w-i18n>`;
                } else {
                    return '';
                }
            }

        }

        return new NotificationManager();
    };

    factory.$inject = ['$compile', '$q', '$rootScope', 'timeLine'];

    angular.module('app').factory('notificationManager', factory);
})();

/**
 * @typedef {Object} INotificationObj
 * @property {string} ns
 * @property {object} [title]
 * @property {string} [title.literal]
 * @property {object} [title.params]
 * @property {object} [body]
 * @property {string} [body.literal]
 * @property {object} [body.params]
 * @property {object} [action]
 * @property {string} [action.literal]
 * @property {object} [action.params]
 * @property {function} [action.callback]
 */
