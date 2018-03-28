(function () {
    'use strict';

    /**
     * @param $compile
     * @param $q
     * @param $rootScope
     * @param {TimeLine} timeLine
     * @param {Queue} Queue
     * @param {function} $templateRequest
     * @param {app.utils} utils
     * @return {INotification}
     */
    const factory = function ($compile, $q, $rootScope, timeLine, Queue, $templateRequest, utils) {

        class BaseNotificationManager {

            /**
             * @param {IBaseNotificationManagerOptions} options
             */
            constructor(options) {
                /**
                 * @type {Queue}
                 * @private
                 */
                this._queue = new Queue({ queueLimit: options.queueLimit });
                /**
                 * @type {IBaseNotificationManagerOptions}
                 * @private
                 */
                this._options = options;
                /**
                 * @type {Signal<Array<INotificationObj>>}
                 */
                this.changeSignal = new tsUtils.Signal();

                this._setHandlers();
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

            getActiveNotificationsList() {
                return this._queue.getActiveList();
            }

            _setHandlers() {
                this._queue.signals.change.on(this._run, this);
            }

            /**
             * @param {string} type
             * @param {INotificationObj} notificationObj
             * @param {number} [delay]
             * @return {Promise}
             * @private
             */
            _push(type, notificationObj, delay = this._options.defaultDelay) {
                const defer = $q.defer();
                const promise = defer.promise;

                /**
                 * @type {_INotificationItem}
                 */
                const notification = utils.liteObject({
                    defer,
                    promise,
                    notificationObj,
                    delay,
                    type,
                    $element: null,
                    destroy: null
                });

                this._queue.push(notification);

                return promise;
            }

            /**
             *
             * @param {Deferred} defer
             * @return {Promise<JQuery>}
             * @private
             */
            _createElement($scope) {
                return BaseNotificationManager._loadTemplate(this._options.templateUrl).then((html) => {
                    return $compile(html)($scope);
                });
            }

            /**
             * @param {Array<_INotificationItem>} list
             * @private
             */
            _run(list) {
                const promises = list.filter((item) => !item.$element)
                    .map((item) => {
                        const $scope = $rootScope.$new(true);
                        $scope.$on('$destroy', item.defer.resolve);

                        Object.assign($scope, item.notificationObj);
                        $scope.type = item.type;

                        item.destroy = () => {
                            $scope.$destroy();
                            if (item.notificationObj.onClose) {
                                item.notificationObj.onClose();
                            }
                        };

                        return this._createElement($scope)
                            .then(($element) => {

                                item.$element = $element;

                                $element.on('click', '[w-notification-close]', () => {
                                    item.destroy();
                                    $element.off();
                                });

                                if (item.delay > 0) {
                                    timeLine.timeout(item.destroy, item.delay);
                                }
                            });
                    });

                Promise.all(promises).then(() => this._dispatch());
            }

            _dispatch() {
                this.changeSignal.dispatch(this.getActiveNotificationsList());
            }

            /**
             * @param {string} url
             * @return {Promise<string>}
             * @private
             */
            static _loadTemplate(url) {
                return $templateRequest(url);
            }

        }

        return BaseNotificationManager;
    };

    factory.$inject = ['$compile', '$q', '$rootScope', 'timeLine', 'Queue', '$templateRequest', 'utils'];

    angular.module('app').factory('BaseNotificationManager', factory);
})();

/**
 * @typedef {object} IBaseNotificationManagerOptions
 * @property {string} templateUrl
 * @property {number} queueLimit
 * @property {number} defaultDelay
 */

/**
 * @typedef {object} INotificationObj
 * @property {string} ns
 * @property {object} [title] Except for alerts
 * @property {string} [title.literal] Except for alerts
 * @property {object} [title.params] Except for alerts
 * @property {object} [body]
 * @property {string} [body.literal]
 * @property {object} [body.params]
 * @property {Function} [onClose]
 */

/**
 * @typedef {object} _INotificationItem
 * @property {Deferred} defer
 * @property {Promise} promise
 * @property {number} delay
 * @property {INotificationObj} notificationObj
 * @property {string} type
 * @property {JQuery} $element
 * @property {function} destroy
 */
